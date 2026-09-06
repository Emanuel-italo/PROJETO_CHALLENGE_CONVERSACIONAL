import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// getReactNativePersistence exists in the RN build at runtime, but firebase's
// published .d.ts for "firebase/auth" doesn't expose it (upstream typing gap).
// @ts-expect-error
import { getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAR6HRJkZdaVhV64T4mUQKyK9JUskzrgEA",
  authDomain: "clyvo-vet-a0a28.firebaseapp.com",
  projectId: "clyvo-vet-a0a28",
  storageBucket: "clyvo-vet-a0a28.firebasestorage.app",
  messagingSenderId: "366192133380",
  appId: "1:366192133380:web:36be2e4b142d7799a6fc51",
  measurementId: "G-ZE4PHSHN6G",
};

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

let auth: Auth;

try {
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(firebaseApp);
}

export { auth };
