// FirebaseConfig.ts
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
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

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Ensure React Native persistence (survives app restarts)
let auth;
try {
  // First load after a fresh start: initialize with RN persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Hot reload / already initialized: reuse existing instance
  auth = getAuth(app);
}

export { app, auth };