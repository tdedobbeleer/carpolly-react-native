// Firebase configuration for React Native
// For Expo managed apps, RN Firebase requires native config files
// For development, we provide fallback defaults

import firestore from '@react-native-firebase/firestore';

// RN Firebase automatically initializes when native config files are present
// For development without config files, we provide helpful error messages
let db: any = null;

try {
  db = firestore();
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed. Make sure you have the config files:');
  console.error('- Android: google-services.json in android/app/');
  console.error('- iOS: GoogleService-Info.plist in ios/');
  console.error('For Expo managed projects, place config files in the root directory for EAS Build');
  throw error;
}

export { db };