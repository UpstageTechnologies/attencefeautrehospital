// Firebase configuration and reactive service layer for Upstage Health
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment or project defaults
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyUpstageHealth2026",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "upstage-health-prod.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "upstage-health-prod",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "upstage-health-prod.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "839210492810",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:839210492810:web:4b830c29f93c8a91b"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;
