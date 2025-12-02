import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyC4yG_GAL-aYJ-OVqC-yDssMfyDGoWdaUQ",
  authDomain: "your-prod-project.firebaseapp.com",
  projectId: "carpolly-4fe11",
  storageBucket: "your-prod-project.appspot.com",
  messagingSenderId: "611172017575",
  appId: "1:611172017575:web:f0b52a8ace683ec19f8282"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)

// Connect to Firestore emulator in development
/**
if (__DEV__) {
  try {
    connectFirestoreEmulator(db, '10.0.2.2', 8080)
  } catch (error) {
    console.log('Firestore emulator already connected')
  }
}
  **/