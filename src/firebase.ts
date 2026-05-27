import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore, getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot, serverTimestamp, getDocFromServer } from "firebase/firestore";
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Analytics is disabled for now to avoid background errors in sandbox
export const analytics = null;

// Auth initialization
export const auth = getAuth(app);

// Use local persistence
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(err => console.error("[Firebase Auth] Persistence error:", err));
}

// Firestore initialization with custom settings for sandbox environment
// Custom settings are critical for running inside an iframe properly
const dbSettings = {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
};

// Use the database ID from config or default
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

export const db = initializeFirestore(app, dbSettings, databaseId);

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      console.warn("Google Login cancelled by user.");
      return null;
    }
    console.error("Error logging in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Firestore Error Handler as per integration guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { 
  collection, addDoc, doc, setDoc, getDoc, getDocs, 
  query, where, orderBy, limit, onSnapshot, 
  serverTimestamp, onAuthStateChanged, getDocFromServer
};
export type { User };

export default app;

