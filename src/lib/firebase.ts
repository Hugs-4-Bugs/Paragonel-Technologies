
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

// Client-side check for missing configuration
if (typeof window !== 'undefined') { // Run only in browser
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      "Firebase configuration is missing or incomplete. " +
      "Ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID " +
      "(and other config values) are set in your environment variables."
    );
  }
}

if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) { // Only initialize if key config is present
    app = initializeApp(firebaseConfig);
  } else {
    // Handle the case where essential config is missing, 
    // perhaps by throwing an error or setting app to a mock/null object
    // For now, we'll log and app might remain undefined, leading to SDK errors downstream
    console.error("Firebase SDK could not be initialized due to missing API Key or Project ID.");
    // You might want to throw an error here or handle it more gracefully depending on requirements
    // For example: throw new Error("Firebase SDK could not be initialized.");
    // Or assign a dummy app object if parts of your app can function without Firebase
  }
} else {
  app = getApp();
}

// @ts-ignore Firestore might be undefined if app isn't initialized
const db: Firestore = app ? getFirestore(app) : undefined;

// @ts-ignore app might be undefined
export { app, db };
