// FirebaseConfig.ts
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  signInAnonymously,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCqvptaHqSaHgcqtQEuc5xXaclI6pOtjrs',
  authDomain: 'fridy-8f8e7.firebaseapp.com',
  databaseURL: 'https://fridy-8f8e7-default-rtdb.firebaseio.com',
  projectId: 'fridy-8f8e7',
  storageBucket: 'fridy-8f8e7.appspot.com',
  messagingSenderId: '23914527840',
  appId: '1:23914527840:web:c62c10857f35202547d705',
  measurementId: 'G-34NXCRG82Z',
};

const app: FirebaseApp =
  getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);

// Auth (keeps your behavior; avoids double-init on RN)
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

// Ensure we have a user (anonymous)
export const ensureAnonAuth = (): Promise<User> =>
  new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (maybeUser) => {
      if (maybeUser) {
        unsub();
        resolve(maybeUser);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsub();
          resolve(cred.user);
        } catch (e) {
          reject(e);
        }
      }
    });
  });

export const db = getFirestore(app);
export { app, auth, serverTimestamp };
