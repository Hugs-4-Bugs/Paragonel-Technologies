
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
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } else {
    app = getApp();
    db = getFirestore(app);
  }
}

// Export undefined instances since the project is deleted.
// This will prevent crashes, but features depending on them will not work.
export { app, db };
