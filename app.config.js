import 'dotenv/config';

export default {
  expo: {
    name: "SAS: Field Service Management",
    slug: "sas-fsm",
    owner: "keanusksks-organization",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/adaptive-icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/SAS-LOGO.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/a86bd2c3-2ea7-47ca-9212-ff9797afe239"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "This app needs access to your location to show your position on the map and provide navigation to job sites.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "This app needs access to your location to show your position on the map and provide navigation to job sites.",
        NSCameraUsageDescription:
          "This app needs access to your camera to take photos for service reports."
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      edgeToEdgeEnabled: false,
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
      package: "com.sas.fsm"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow SAS: Field Service Management to use your location for navigation to job sites."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow SAS: Field Service Management to access your camera to take photos for service reports.",
          "microphonePermission": "Allow SAS: Field Service Management to access your microphone for video recording.",
          "recordAudioAndroid": true
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow SAS: Field Service Management to access your photos for service reports.",
          "cameraPermission": "Allow SAS: Field Service Management to access your camera to take photos for service reports."
        }
      ],
      "expo-navigation-bar"
    ],
    extra: {
      eas: {
        projectId: "a86bd2c3-2ea7-47ca-9212-ff9797afe239"
      }
    },
  }
};