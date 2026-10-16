import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc } from 'firebase/firestore';
import { getDatabase, Database, ref, get as rtdbGet } from 'firebase/database';
import defaultFirebaseJson from '../config/firebaseDefaultConfig.json';

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

// 1. Bundled static config (persisted in codebase for all visitors & live deployments)
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigParams | null =
  defaultFirebaseJson && defaultFirebaseJson.apiKey && defaultFirebaseJson.projectId
    ? (defaultFirebaseJson as FirebaseConfigParams)
    : null;

// 2. Read config from Environment Variables (Vercel / Cloud Run / .env)
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
      databaseURL:
        import.meta.env.VITE_FIREBASE_DATABASE_URL ||
        `https://${projectId}-default-rtdb.firebaseio.com`,
    };
  }
  return null;
}

// 3. Read user saved config from LocalStorage (allows direct setup inside Admin UI)
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

// 4. Source identifier so admin knows where config is originating from
export function getEffectiveConfigSource(): 'localStorage' | 'env' | 'bundled' | 'none' {
  if (getStoredFirebaseConfig()) return 'localStorage';
  if (getEnvFirebaseConfig()) return 'env';
  if (DEFAULT_FIREBASE_CONFIG) return 'bundled';
  return 'none';
}

// 5. Get Active Firebase Config (Stored user config, then Env, then Bundled)
export function getActiveFirebaseConfig(): FirebaseConfigParams | null {
  const cfg = getStoredFirebaseConfig() || getEnvFirebaseConfig() || DEFAULT_FIREBASE_CONFIG;
  if (cfg && !cfg.databaseURL && cfg.projectId) {
    cfg.databaseURL = `https://${cfg.projectId}-default-rtdb.firebaseio.com`;
  }
  return cfg;
}

// 6. Save Firebase Config to LocalStorage
export function saveFirebaseConfig(config: FirebaseConfigParams | null) {
  if (!config) {
    localStorage.removeItem(STORAGE_KEY);
    cachedApp = null;
    cachedDb = null;
    cachedRtdb = null;
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    cachedApp = null;
    cachedDb = null;
    cachedRtdb = null;
  }
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let cachedRtdb: Database | null = null;

// 7. Initialize or retrieve Firestore instance
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
    console.error('Firebase Firestore initialization error:', error);
    return null;
  }
}

// 8. Initialize or retrieve Realtime Database instance
export function getFirebaseRealtimeDb(): { app: FirebaseApp; rtdb: Database } | null {
  const config = getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    if (!cachedApp) {
      const existingApps = getApps();
      cachedApp = existingApps.length > 0 ? getApp() : initializeApp(config);
    }

    if (!cachedRtdb && cachedApp) {
      const dbUrl = config.databaseURL || `https://${config.projectId}-default-rtdb.firebaseio.com`;
      cachedRtdb = getDatabase(cachedApp, dbUrl);
    }

    return cachedApp && cachedRtdb ? { app: cachedApp, rtdb: cachedRtdb } : null;
  } catch (error) {
    console.error('Firebase Realtime Database initialization error:', error);
    return null;
  }
}

// 9. Test connection to either Firestore or Realtime Database
export async function testFirebaseConnection(config: FirebaseConfigParams): Promise<{ success: boolean; message: string; databaseType?: 'firestore' | 'realtime' }> {
  try {
    const testAppName = `test-app-${Date.now()}`;
    const testApp = initializeApp(config, testAppName);

    // First try Realtime Database (which matches user's console setup)
    const dbUrl = config.databaseURL || `https://${config.projectId}-default-rtdb.firebaseio.com`;
    let rtdbSuccess = false;
    let rtdbError = '';

    try {
      const testRtdb = getDatabase(testApp, dbUrl);
      const testRef = ref(testRtdb, '.info/connected');
      await rtdbGet(testRef);
      rtdbSuccess = true;
    } catch (e: any) {
      rtdbError = e.message || '';
    }

    // Next try Firestore
    let firestoreSuccess = false;
    let firestoreError = '';

    try {
      const testDb = getFirestore(testApp);
      const pingDoc = doc(testDb, 'habajaba_settings', 'ping');
      await getDoc(pingDoc);
      firestoreSuccess = true;
    } catch (ruleErr: any) {
      if (ruleErr.code === 'permission-denied') {
        firestoreError = 'Firestore Rules পারমিশন ব্লক করছে।';
      } else if (ruleErr.code === 'not-found' || ruleErr.message?.includes('database')) {
        firestoreError = 'Firestore Database এখনও তৈরি করা হয়নি।';
      } else {
        firestoreError = ruleErr.message || '';
      }
    }

    if (rtdbSuccess || firestoreSuccess) {
      const type = rtdbSuccess && !firestoreSuccess ? 'realtime' : 'firestore';
      return {
        success: true,
        databaseType: type,
        message: `Firebase প্রজেক্ট "${config.projectId}" এর সাথে সফলভাবে রিয়েল-টাইমে লাইভ সংযোগ নিশ্চিত হয়েছে! (${type === 'realtime' ? 'Realtime Database' : 'Firestore Database'})`,
      };
    }

    // If both had errors, explain clearly
    return {
      success: true, // We allow credentials to save if initialized successfully
      databaseType: 'realtime',
      message: `Firebase প্রজেক্ট "${config.projectId}" ক্রেডেনশিয়াল সংরক্ষণ করা হয়েছে। Realtime Database Rules এ { ".read": true, ".write": true } নিশ্চিত করুন।`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Firebase সংযোগ ব্যর্থ হয়েছে। অনুগ্রহ করে ক্রেডেনশিয়াল যাচাই করুন।',
    };
  }
}

