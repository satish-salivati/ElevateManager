// =================================================================================
// !!! CRITICAL SECURITY WARNING !!!
// =================================================================================
// This file contains your secret Firebase keys.
//
// - DO NOT share this file with anyone.
// - DO NOT upload this file to a public GitHub repository.
//
// Anyone with these keys can access your application's data. Keeping this file
// private is essential for the security of your app and its user data.
// =================================================================================

import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Your unique Firebase configuration object.
const firebaseConfig = {
  apiKey: "AIzaSyB0KKajoaAV7YoiCoj6zdnvea0rw47t1Cw",
  authDomain: "elevatemanager-b914f.firebaseapp.com",
  projectId: "elevatemanager-b914f",
  storageBucket: "elevatemanager-b914f.appspot.com",
  messagingSenderId: "652454379243",
  appId: "1:652454379243:web:de5772c259b2e7700bc8ae",
  measurementId: "G-669X3PBJ9D"
};

// Check if the essential Firebase keys are present.
export const isFirebaseConfigured = !!firebaseConfig.apiKey;


// Singleton instances (You don't need to change anything below this line)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// This function initializes Firebase and MUST be called before any other Firebase service is used.
function initializeFirebase() {
    if (app) return; // Already initialized

    if (!isFirebaseConfigured) {
        console.warn("Firebase is not configured. Please paste your project's firebaseConfig object into `config/firebase.ts`.");
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
        throw new Error("Firebase Authentication could not be initialized. Please check your configuration in `config/firebase.ts`.");
    }
    return auth;
};

export const getDB = (): Firestore => {
    if (!db) {
        initializeFirebase();
    }
    if (!db) {
        throw new Error("Firestore could not be initialized. Please check your configuration in `config/firebase.ts`.");
    }
    return db;
};
