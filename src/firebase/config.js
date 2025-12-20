// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-F_YXrND1f4f40lNxKNQXNIQPKFjcAPg",
  authDomain: "ktoubaty.firebaseapp.com",
  projectId: "ktoubaty",
  storageBucket: "ktoubaty.firebasestorage.app",
  messagingSenderId: "232995447268",
  appId: "1:232995447268:web:c38907121f53a4126d67f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);