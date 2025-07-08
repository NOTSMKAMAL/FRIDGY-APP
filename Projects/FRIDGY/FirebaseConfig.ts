// FirebaseConfig.ts
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";


const firebaseConfig = {
  apiKey: "AIzaSyCqvptaHqSaHgcqtQEuc5xXaclI6pOtjrs",
  authDomain: "fridy-8f8e7.firebaseapp.com",
  databaseURL: "https://fridy-8f8e7-default-rtdb.firebaseio.com",
  projectId: "fridy-8f8e7",
  storageBucket: "fridy-8f8e7.appspot.com",
  messagingSenderId: "23914527840",
  appId: "1:23914527840:web:c62c10857f35202547d705",
  measurementId: "G-34NXCRG82Z"
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

// Initialize auth safely for both web and mobile
let auth;
try {
  if (Platform.OS !== "web") {
    // For React Native, check if auth is already initialized
    auth = getAuth(app);
  } else {
    // For web, use getAuth
    auth = getAuth(app);
  }
} catch (error) {
  // If getAuth fails, try initializeAuth for React Native
  if (Platform.OS !== "web") {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    throw error;
  }
}

export { auth };