import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_RpmkFRJfWkcg6apFXufz5dz8NvT2P4Q",
  authDomain: "yogi-mart.firebaseapp.com",
  projectId: "yogi-mart",
  storageBucket: "yogi-mart.firebasestorage.app",
  messagingSenderId: "507607355701",
  appId: "1:507607355701:web:555f8fd6710804af533c7c",
  measurementId: "G-6KZGLS4651",
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);


function resolveAuth(): Auth {
  try {
   
    const firebaseAuth = require("firebase/auth");

    const persistenceFactory =
      firebaseAuth.getReactNativePersistence ??
      require("firebase/auth/react-native")?.getReactNativePersistence;

    if (persistenceFactory) {
      return initializeAuth(app, {
        persistence: persistenceFactory(AsyncStorage),
      });
    }
  } catch {
    
  }

  return getAuth(app);
}

export const auth = resolveAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;