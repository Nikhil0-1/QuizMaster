// src/firebase/authService.js
import { auth } from './config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const onAuthChanged = (callback) =>
  onAuthStateChanged(auth, callback);
