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

// Use native persistence only on mobile; fallback to web auth on web
export const auth =
  Platform.OS !== "web"
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      })
    : getAuth(app);