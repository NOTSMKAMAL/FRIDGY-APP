// FirebaseConfig.ts
// Stable, Fast Refresh–safe Firebase setup for React Native (Expo) + Web


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
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';


// --- CONFIG -----------------------------------------------------------------
const firebaseConfig = {
apiKey: 'AIzaSyCqvptaHqSaHgcqtQEuc5xXaclI6pOtjrs',
authDomain: 'fridy-8f8e7.firebaseapp.com',
databaseURL: 'https://fridy-8f8e7-default-rtdb.firebaseio.com',
projectId: 'fridy-8f8e7',
storageBucket: 'fridy-8f8e7.appspot.com',
messagingSenderId: '23914527840',
appId: '1:23914527840:web:c62c10857f35202547d705',
measurementId: 'G-34NXCRG82Z',
} as const;


// --- APP (singleton) --------------------------------------------------------
export const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);


// --- AUTH (singleton) -------------------------------------------------------
// On native RN, we must explicitly initialize Auth with AsyncStorage persistence.
// On web, use the default getAuth(app) (web persistence is handled by SDK).
let auth_: Auth | undefined;
function createAuth(): Auth {
if (auth_) return auth_;
if (Platform.OS === 'web') {
auth_ = getAuth(app);
} else {
try {
auth_ = initializeAuth(app, {
// Ensures the session survives app restarts (RN AsyncStorage)
persistence: getReactNativePersistence(AsyncStorage),
});
} catch {
// Hot-reload path (already initialized)
auth_ = getAuth(app);
}
}
return auth_;
}
export const auth: Auth = createAuth();


// --- FIRESTORE (singleton) --------------------------------------------------
export const db = getFirestore(app);


// --- HELPERS ----------------------------------------------------------------
/**
* Ensures there is a signed-in user (anonymous if necessary).
* Resolves with the current (or newly created) Firebase Auth user.
*/
export const ensureAnonAuth = (): Promise<User> =>
new Promise((resolve, reject) => {
const unsub = onAuthStateChanged(auth, async (maybeUser) => {
try {
if (maybeUser) {
unsub();
resolve(maybeUser);
return;
}
const cred = await signInAnonymously(auth);
unsub();
resolve(cred.user);
} catch (e) {
unsub();
reject(e);
}
});
});


// Re-export commonly-used server utility
export { serverTimestamp } from 'firebase/firestore';


// Optional convenience: get current UID (or null) without awaiting
export const currentUid = (): string | null => auth.currentUser?.uid ?? null;