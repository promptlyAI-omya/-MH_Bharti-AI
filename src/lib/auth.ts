import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { auth } from "./firebase";

const getFirebaseAuth = () => {
  if (!auth) {
    throw new Error("Firebase auth is not configured. Check NEXT_PUBLIC_FIREBASE_* env vars and restart the dev server.");
  }

  return auth;
};

// Email & Password Auth
export const signUpWithEmail = async (email: string, pass: string) => {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, pass);
};

export const loginWithEmail = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, pass);
};

// Google Auth
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(getFirebaseAuth(), provider);
};

// Phone Auth
export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(getFirebaseAuth(), containerId, {
    size: 'invisible',
  });
};

export const sendPhoneCode = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
  return signInWithPhoneNumber(getFirebaseAuth(), phoneNumber, appVerifier);
};

export const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
  return confirmationResult.confirm(code);
};

// Logout
export const logout = async () => {
  return signOut(getFirebaseAuth());
};
