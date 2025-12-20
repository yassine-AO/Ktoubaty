import { db } from './config';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Create user doc if it doesn't exist
export const createUserIfNotExists = async (uid, email, displayName = null, favoriteGenres = []) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      email,
      displayName,
      favoriteGenres,
      favorites: [], // Open Library work IDs
      createdAt: new Date().toISOString(),
    });
  }
};

// Add book to favorites
export const addFavorite = async (uid, bookId) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { favorites: arrayUnion(bookId) }, { merge: true });
};

// Remove book from favorites
export const removeFavorite = async (uid, bookId) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { favorites: arrayRemove(bookId) }, { merge: true });
};

// Get user favorites
export const getFavorites = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data().favorites : [];
};

// Get user data
export const getUserData = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};