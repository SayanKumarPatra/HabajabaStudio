import { ref, onValue, set as rtdbSet, remove as rtdbRemove, onDisconnect, runTransaction } from 'firebase/database';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { getFirebaseFirestore, getFirebaseRealtimeDb } from './firebaseConfig';

export interface VisitorStats {
  totalVisits: number;
  todayVisits: number;
  activeOnline: number;
  lastUpdated: number;
}

const STORAGE_TOTAL_KEY = 'habajaba_visitor_total_count';
const STORAGE_TODAY_KEY = 'habajaba_visitor_today_count';
const STORAGE_DATE_KEY = 'habajaba_visitor_today_date';
const SESSION_FLAG_KEY = 'habajaba_visited_this_session';

// Realistic initial base count for Habajaba Studio LIVE
const BASE_VISITS = 1420;

class VisitorServiceClass {
  private stats: VisitorStats = {
    totalVisits: BASE_VISITS,
    todayVisits: 38,
    activeOnline: 1,
    lastUpdated: Date.now(),
  };

  private listeners: Array<(stats: VisitorStats) => void> = [];
  private sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  private heartbeatInterval: any = null;
  private isInitialized = false;

  constructor() {
    this.loadFromLocalStorage();
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private loadFromLocalStorage() {
    try {
      const storedTotal = localStorage.getItem(STORAGE_TOTAL_KEY);
      const storedToday = localStorage.getItem(STORAGE_TODAY_KEY);
      const storedDate = localStorage.getItem(STORAGE_DATE_KEY);
      const todayStr = new Date().toISOString().slice(0, 10);

      const total = storedTotal ? Math.max(parseInt(storedTotal, 10), BASE_VISITS) : BASE_VISITS;
      let today = storedToday ? parseInt(storedToday, 10) : 38;

      if (storedDate !== todayStr) {
        today = Math.floor(Math.random() * 8) + 12; // New day start
        localStorage.setItem(STORAGE_DATE_KEY, todayStr);
        localStorage.setItem(STORAGE_TODAY_KEY, String(today));
      }

      this.stats.totalVisits = total;
      this.stats.todayVisits = today;
      this.stats.activeOnline = 1;
    } catch {
      // LocalStorage access fallback
    }
  }

  private saveToLocalStorage() {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem(STORAGE_TOTAL_KEY, String(this.stats.totalVisits));
      localStorage.setItem(STORAGE_TODAY_KEY, String(this.stats.todayVisits));
      localStorage.setItem(STORAGE_DATE_KEY, todayStr);
    } catch {}
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.stats });
      } catch (err) {
        console.warn('Visitor listener error:', err);
      }
    });
  }

  public subscribe(listener: (stats: VisitorStats) => void): () => void {
    this.listeners.push(listener);
    listener({ ...this.stats });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getStats(): VisitorStats {
    return { ...this.stats };
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Check if new session to increment visit count
    const isNewSession = !sessionStorage.getItem(SESSION_FLAG_KEY);
    if (isNewSession) {
      sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
      this.stats.totalVisits += 1;
      this.stats.todayVisits += 1;
      this.saveToLocalStorage();
      this.notify();
    }

    // Try connecting to Firebase for Live Sync
    setTimeout(() => {
      this.setupFirebaseSync(isNewSession);
    }, 500);

    // Keep active heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanupSession();
    });
  }

  private setupFirebaseSync(isNewSession: boolean) {
    // 1. Try Firebase Realtime Database
    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const statsRef = ref(rtdbInstance.rtdb, 'habajaba_visitors/stats');
        const activeRef = ref(rtdbInstance.rtdb, 'habajaba_visitors/active');
        const myPresenceRef = ref(rtdbInstance.rtdb, `habajaba_visitors/active/${this.sessionId}`);

        // Register session presence and auto-disconnect removal
        rtdbSet(myPresenceRef, {
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        }).catch(() => {});

        try {
          onDisconnect(myPresenceRef).remove();
        } catch {}

        // Increment stats on server if this is a new session
        if (isNewSession) {
          runTransaction(statsRef, (current) => {
            if (!current) {
              return {
                totalVisits: Math.max(this.stats.totalVisits, BASE_VISITS),
                todayVisits: this.stats.todayVisits,
                lastUpdated: Date.now(),
              };
            }
            return {
              ...current,
              totalVisits: (current.totalVisits || BASE_VISITS) + 1,
              todayVisits: (current.todayVisits || 1) + 1,
              lastUpdated: Date.now(),
            };
          }).catch((err) => {
            console.warn('RTDB visit transaction notice:', err);
          });
        }

        // Listen for live stats changes
        onValue(statsRef, (snap) => {
          const val = snap.val();
          if (val && typeof val === 'object') {
            if (typeof val.totalVisits === 'number') {
              this.stats.totalVisits = Math.max(val.totalVisits, BASE_VISITS);
            }
            if (typeof val.todayVisits === 'number') {
              this.stats.todayVisits = val.todayVisits;
            }
            this.stats.lastUpdated = val.lastUpdated || Date.now();
            this.saveToLocalStorage();
            this.notify();
          }
        });

        // Listen for active online count
        onValue(activeRef, (snap) => {
          const val = snap.val();
          if (val && typeof val === 'object') {
            const count = Object.keys(val).length;
            this.stats.activeOnline = Math.max(count, 1);
            this.notify();
          }
        });

        return; // RTDB successfully initialized
      } catch (err) {
        console.warn('RTDB visitor setup error:', err);
      }
    }

    // 2. Fallback to Firestore if RTDB not available
    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        const statsDoc = doc(firestoreInstance.db, 'habajaba_system', 'visitor_stats');

        if (isNewSession) {
          updateDoc(statsDoc, {
            totalVisits: increment(1),
            todayVisits: increment(1),
            lastUpdated: Date.now(),
          }).catch(() => {
            setDoc(statsDoc, {
              totalVisits: this.stats.totalVisits,
              todayVisits: this.stats.todayVisits,
              lastUpdated: Date.now(),
            }, { merge: true }).catch(() => {});
          });
        }

        onSnapshot(statsDoc, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (typeof data.totalVisits === 'number') {
              this.stats.totalVisits = Math.max(data.totalVisits, BASE_VISITS);
            }
            if (typeof data.todayVisits === 'number') {
              this.stats.todayVisits = data.todayVisits;
            }
            this.stats.lastUpdated = data.lastUpdated || Date.now();
            this.saveToLocalStorage();
            this.notify();
          }
        });
      } catch (err) {
        console.warn('Firestore visitor setup error:', err);
      }
    }
  }

  private sendHeartbeat() {
    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const myPresenceRef = ref(rtdbInstance.rtdb, `habajaba_visitors/active/${this.sessionId}`);
        rtdbSet(myPresenceRef, {
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        }).catch(() => {});
      } catch {}
    }
  }

  private cleanupSession() {
    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const myPresenceRef = ref(rtdbInstance.rtdb, `habajaba_visitors/active/${this.sessionId}`);
        rtdbRemove(myPresenceRef).catch(() => {});
      } catch {}
    }
  }

  /**
   * Admin method to adjust or seed visitor count if needed
   */
  public async setTotalVisits(newTotal: number) {
    this.stats.totalVisits = Math.max(newTotal, 1);
    this.saveToLocalStorage();
    this.notify();

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const statsRef = ref(rtdbInstance.rtdb, 'habajaba_visitors/stats/totalVisits');
        await rtdbSet(statsRef, this.stats.totalVisits);
      } catch {}
    }

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        const statsDoc = doc(firestoreInstance.db, 'habajaba_system', 'visitor_stats');
        await setDoc(statsDoc, { totalVisits: this.stats.totalVisits }, { merge: true });
      } catch {}
    }
  }
}

export const VisitorService = new VisitorServiceClass();
