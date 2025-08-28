// src/plugins/firebase/index.js
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    // appId: import.meta.env.VITE_FIREBASE_APP_ID,
    // messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    // storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// За замовчуванням — local (Remember me). У формі нижче ми будемо перемикати.
setPersistence(auth, browserLocalPersistence)

export { app, auth, setPersistence, browserLocalPersistence, browserSessionPersistence }
