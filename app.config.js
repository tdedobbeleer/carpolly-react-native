module.exports = {
  "expo": {
    "name": "CarPolly",
    "slug": "carpolly-react-native",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "stretch",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "googleServicesFile": process.env.GOOGLE_SERVICES_PLIST,
      "bundleIdentifier": "com.carpolly.reactnative"
    },
    "android": {
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "package": "com.carpolly.reactnative"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-font",
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "scheme": "carpolly",
    "extra": {
      "eas": {
        "projectId": "b0f85837-57bd-4452-abfe-7540d102c435"
      }
    }
  }
}
