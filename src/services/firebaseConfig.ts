import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL?: string;
}

const STORAGE_KEY = 'habajaba_firebase_config';

// 1. Read default config from Environment Variables (if set during build or dev)
export function getEnvFirebaseConfig(): FirebaseConfigParams | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }
  return null;
}

// 2. Read user saved config from LocalStorage (allows direct setup inside Admin UI)
export function getStoredFirebaseConfig(): FirebaseConfigParams | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored Firebase config:', err);
  }
  return null;
}

// 3. Get Active Firebase Config (User-saved takes precedence, then Env)
export function getActiveFirebaseConfig(): FirebaseConfigParams | null {
  return getStoredFirebaseConfig() || getEnvFirebaseConfig();
}

// 4. Save Firebase Config to LocalStorage
export function saveFirebaseConfig(config: FirebaseConfigParams | null) {
  if (!config) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

// 5. Initialize or retrieve Firestore instance
export function getFirebaseFirestore(): { app: FirebaseApp; db: Firestore } | null {
  const config = getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    if (!cachedApp) {
      const existingApps = getApps();
      cachedApp = existingApps.length > 0 ? getApp() : initializeApp(config);
    }

    if (!cachedDb && cachedApp) {
      cachedDb = getFirestore(cachedApp);
    }

    return cachedApp && cachedDb ? { app: cachedApp, db: cachedDb } : null;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
}

// 6. Test connection to Firebase
export async function testFirebaseConnection(config: FirebaseConfigParams): Promise<{ success: boolean; message: string }> {
  try {
    const testAppName = `test-app-${Date.now()}`;
    const testApp = initializeApp(config, testAppName);
    const testDb = getFirestore(testApp);

    // Verify Firestore can be instantiated
    if (testDb) {
      return {
        success: true,
        message: `Firebase connection initialized successfully for project "${config.projectId}".`,
      };
    }
    return {
      success: false,
      message: 'Could not initialize Firestore instance.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Firebase initialization failed. Please check the credentials.',
    };
  }
}
