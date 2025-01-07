import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import Exif from 'react-native-exif';

const CameraScreen = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [data, setData] = useState<any>(null);
  const device = useCameraDevice('back');

  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    if (permission !== 'granted') {
      Alert.alert('Camera permission is required!');
    }
  };

  const extractCoordinates = metadatas => {
    console.log('Metadatas extracted', metadatas);

    // Access nested EXIF data
    const nestedExif = metadatas?.exif?.exif || metadatas?.exif || {};

    const {
      GPSLatitude,
      GPSLatitudeRef,
      GPSLongitude,
      GPSLongitudeRef,
      Model,
      Make,
      DateTime,
    } = nestedExif;

    if (!GPSLatitude || !GPSLongitude) {
      console.warn('GPS data is not available in this photo.');
      return null;
    }

    const convertToDecimal = (gpsData, ref) => {
      const [degrees, minutes, seconds] = gpsData.split(',').map(item => {
        const [numerator, denominator] = item.split('/').map(Number);
        return numerator / denominator;
      });

      let decimal = degrees + minutes / 60 + seconds / 3600;
      if (ref === 'S' || ref === 'W') {
        decimal *= -1;
      }

      return decimal;
    };

    const latitude = convertToDecimal(GPSLatitude, GPSLatitudeRef);
    const longitude = convertToDecimal(GPSLongitude, GPSLongitudeRef);

    return {latitude, longitude, Model, Make, DateTime};
  };

  const capturePhoto = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto({
          quality: 85,
          skipMetadata: false,
        });

        setPhotoUri(photo.path);

        // Extract EXIF data
        Exif.getExif(photo.path).then(exifData => {
          setMetadata(exifData);
          const location = extractCoordinates({exif: exifData});

          console.log('Location->', location);

          if (location) {
            setData(location);
            console.log('Latitude:', location.latitude);
            console.log('Longitude:', location.longitude);
          }
        });
      } else {
        console.error('Camera reference is not available.');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>Loading Camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <>
          <Camera
            style={styles.camera}
            ref={cameraRef}
            device={device}
            isActive={true}
            photo={true}
            enableLocation={true}
          />
          <Button title="Capture Photo" onPress={capturePhoto} />
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.result}>
          <Image source={{uri: `file://${photoUri}`}} style={styles.image} />
          <Text>Metadata:</Text>
          <View style={{alignItems: 'flex-start'}}>
            <View
              style={{
                flexDirection: 'row',
                gap: 20,
              }}>
              <Text>Device Make:</Text>
              <Text>{data?.Make}</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                gap: 20,
              }}>
              <Text>Device Model:</Text>
              <Text>{data?.Model}</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                gap: 20,
              }}>
              <Text>Date and Time:</Text>
              <Text>{data?.DateTime}</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                gap: 20,
              }}>
              <Text>Latitude:</Text>
              <Text>{data?.latitude}</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                gap: 20,
              }}>
              <Text>Longitude:</Text>
              <Text>{data?.longitude}</Text>
            </View>
          </View>
          <Button title="Retake" onPress={() => setPhotoUri(null)} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  camera: {flex: 1},
  result: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  image: {width: 300, height: 300, marginBottom: 20},
});

export default CameraScreen;
