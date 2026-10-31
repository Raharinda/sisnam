import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import {
  Auth,
  initializeAuth,
  Persistence,
} from "firebase/auth";
import { Database, getDatabase } from "firebase/database";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

function getReactNativePersistence(storage: typeof AsyncStorage): Persistence {
  return class {
    static type = "LOCAL" as const;
    readonly type: "LOCAL";
    constructor() {
      this.type = "LOCAL";
    }
    async _isAvailable() {
      try {
        await storage.setItem("firebase:storage-test", "1");
        await storage.removeItem("firebase:storage-test");
        return true;
      } catch {
        return false;
      }
    }
    _set(key: string, value: unknown) {
      return storage.setItem(key, JSON.stringify(value));
    }
    async _get<T>(key: string): Promise<T | null> {
      const value = await storage.getItem(key);
      return value ? JSON.parse(value) as T : null;
    }
    _remove(key: string) {
      return storage.removeItem(key);
    }
    _addListener(_key: string, _listener: (value: unknown) => void) {
      return;
    }
    _removeListener(_key: string, _listener: (value: unknown) => void) {
      return;
    }
  } as unknown as Persistence;
}

const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };
export const database: Database = getDatabase(app);
export const firestore: Firestore = getFirestore(app);
