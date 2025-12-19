// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-F_YXrND1f4f40lNxKNQXNIQPKFjcAPg",
  authDomain: "ktoubaty.firebaseapp.com",
  projectId: "ktoubaty",
  storageBucket: "ktoubaty.firebasestorage.app",
  messagingSenderId: "232995447268",
  appId: "1:232995447268:web:c38907121f53a4126d67f1"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);