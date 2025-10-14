
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;

// Client-side check for missing configuration
if (typeof window !== 'undefined') {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      "Firebase configuration is missing or incomplete. " +
      "Please create a Firebase project and add the configuration to your .env file."
    );
  } else {
    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
      } catch (e) {
        console.error("Error initializing Firebase:", e);
      }
    } else {
      app = getApp();
      db = getFirestore(app);
    }
  }
}

// @ts-ignore
export { app, db };
