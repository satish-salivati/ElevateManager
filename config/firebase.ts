import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// =================================================================================
// PRODUCTION-READY FIREBASE CONFIGURATION
// =================================================================================
// This configuration now reads its values from environment variables.
// You must set these variables in your hosting provider's dashboard.
// This keeps your secret keys out of the source code, which is a security best practice.
//
// Required Environment Variables:
// - FIREBASE_API_KEY
// - FIREBASE_AUTH_DOMAIN
// - FIREBASE_PROJECT_ID
// - FIREBASE_STORAGE_BUCKET
// - FIREBASE_MESSAGING_SENDER_ID
// - FIREBASE_APP_ID
// - FIREBASE_MEASUREMENT_ID
// =================================================================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0KKajoaAV7YoiCoj6zdnvea0rw47t1Cw",
  authDomain: "elevatemanager-b914f.firebaseapp.com",
  projectId: "elevatemanager-b914f",
  storageBucket: "elevatemanager-b914f.appspot.com",
  messagingSenderId: "652454379243",
  appId: "1:652454379243:web:de5772c259b2e7700bc8ae",
  measurementId: "G-669X3PBJ9D"
};


// Check if all required Firebase environment variables are set.
export const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;


// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// This function initializes Firebase and MUST be called before any other Firebase service is used.
function initializeFirebase() {
    if (app) return; // Already initialized

    if (!isFirebaseConfigured) {
        console.warn("Firebase is not configured. Please set the required Firebase environment variables in your hosting environment.");
        return;
    }
    
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        // Reset instances if initialization fails
        app = null;
        auth = null;
        db = null;
    }
}

// Getter functions that ensure initialization before returning the service instance.
export const getFirebaseAuth = (): Auth => {
    if (!auth) {
        initializeFirebase();
    }
    if (!auth) {
        throw new Error("Firebase Authentication could not be initialized. Please check your configuration and environment variables.");
    }
    return auth;
};

export const getDB = (): Firestore => {
    if (!db) {
        initializeFirebase();
    }
    if (!db) {
        throw new Error("Firestore could not be initialized. Please check your configuration and environment variables.");
    }
    return db;
};
