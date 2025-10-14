
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

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

// Client-side check for missing configuration
if (typeof window !== 'undefined') {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      "Firebase configuration is missing or incomplete. " +
      "The original Firebase project was deleted. Profile saving/loading is disabled. " +
      "To re-enable, create a new Firebase project, add the web app config to your .env file, and uncomment the code in src/lib/firebase.ts and src/app/profile/page.tsx."
    );
  } else if (!getApps().length) {
    // This block will now only run if the config keys exist.
    // Uncomment this block once you have a new Firebase project and keys.
    /*
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    } catch (e) {
      console.error("Error initializing Firebase:", e);
    }
    */
  } else {
    // This block will also only run if config keys exist.
    // Uncomment this block once you have a new Firebase project and keys.
    /*
    app = getApp();
    db = getFirestore(app);
    */
  }
}

// Export undefined instances since the project is deleted.
// This will prevent crashes, but features depending on them will not work.
export { app, db };
