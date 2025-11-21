import 'dotenv/config';

export default {
  expo: {
    name: "FSM",
    slug: "sas-fsm",
    owner: "keanumd2002",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/SAS-LOGO.png",
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
      url: "https://u.expo.dev/3049bc12-ae03-4861-99ec-f27c37563dec"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "This app needs access to your location to show your position on the map and provide navigation to job sites.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "This app needs access to your location to show your position on the map and provide navigation to job sites."
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/SAS-LOGO.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
      package: "com.anonymous.FSM"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow FSM to use your location for navigation to job sites."
        }
      ],
      "expo-navigation-bar"
    ],
    extra: {
      eas: {
        projectId: "3049bc12-ae03-4861-99ec-f27c37563dec"
      }
    },
    owner: "keanumd2002"
  }
};
