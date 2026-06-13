import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAXHvPZ-hgVwGzVyLOZK676f2vHbEgZVNI",
  authDomain: "quantumfusion-solutions.firebaseapp.com",
  projectId: "quantumfusion-solutions",
  storageBucket: "quantumfusion-solutions.firebasestorage.app",
  messagingSenderId: "553529016792",
  appId: "1:553529016792:web:696a01912b60bf8fc6f2ad",
  measurementId: "G-MYYNS2X0WT"
};

let app: FirebaseApp;
let db: Firestore;

// Client-side check for missing configuration
if (typeof window !== 'undefined') {
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

// @ts-ignore
export { app, db };
