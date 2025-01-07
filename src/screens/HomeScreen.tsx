import React, {useEffect, useState} from 'react';
import {View, Text, Button, StyleSheet, Alert, Platform} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import {PermissionsAndroid} from 'react-native';
import {navigationRef} from '../navigation/RootContainer';
import {SCREENS} from '../navigation/screenNames';

const HomeScreen = () => {
  const [cameraPermission, setCameraPermission] = useState(null);
  const [microphonePermission, setMicrophonePermission] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const cameraStatus = await Camera.getCameraPermissionStatus();
      const microphoneStatus = await Camera.getMicrophonePermissionStatus();
      const locationStatus =
        Platform.OS === 'android'
          ? await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            )
          : 'unavailable'; // iOS permissions are handled differently

      setCameraPermission(cameraStatus);
      setMicrophonePermission(microphoneStatus);
      setLocationPermission(locationStatus ? 'granted' : 'denied');
    };

    checkPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const cameraStatus = await Camera.requestCameraPermission();
      const microphoneStatus = await Camera.requestMicrophonePermission();
      let locationStatus = 'denied';

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs location access for geotagging photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        locationStatus =
          granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
      } else {
        // iOS: Handle location permissions using react-native-permissions or similar library
        locationStatus = 'unavailable';
        Alert.alert('Location permission not implemented for iOS.');
      }

      setCameraPermission(cameraStatus);
      setMicrophonePermission(microphoneStatus);
      setLocationPermission(locationStatus);
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  useEffect(() => {
    if (
      cameraPermission === 'granted' &&
      microphonePermission === 'granted' &&
      locationPermission === 'granted'
    ) {
      navigationRef.navigate(SCREENS.CameraScreen);
    }
  }, [cameraPermission, microphonePermission, locationPermission]);

  return (
    <View style={styles.container}>
      <Text>Camera Permission: {cameraPermission}</Text>
      <Text>Microphone Permission: {microphonePermission}</Text>
      <Text>Location Permission: {locationPermission}</Text>
      {cameraPermission !== 'granted' ||
      microphonePermission !== 'granted' ||
      locationPermission !== 'granted' ? (
        <Button title="Request Permissions" onPress={requestPermissions} />
      ) : (
        <Text>All Permissions Granted!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});

export default HomeScreen;
