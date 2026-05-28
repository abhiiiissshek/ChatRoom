// src/firebase.js

import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup as fbSignInWithPopup,
  signOut as fbSignOut,
} from "firebase/auth";

// =========================
// FIREBASE CONFIG
// =========================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID,

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID,
};

// =========================
// INIT
// =========================

const app = initializeApp(firebaseConfig);

// =========================
// AUTH
// =========================

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// =========================
// EXPORTS
// =========================

export {
  auth,
  provider,
  fbSignInWithPopup,
  fbSignOut,
};