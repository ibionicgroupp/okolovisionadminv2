// src/plugins/firebase/index.js
import { initializeApp } from 'firebase/app'
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth'

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

// 🔹 за замовчуванням — локальна авторизація
// (запис у LocalStorage + IndexedDB, користувач збережеться навіть після перезавантаження браузера)
setPersistence(auth, browserLocalPersistence)

export async function login(email, password, remember = true) {
    // якщо треба "пам’ятати мене"
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    return signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
    return signOut(auth)
}

export { app, auth, setPersistence, browserLocalPersistence, browserSessionPersistence }
