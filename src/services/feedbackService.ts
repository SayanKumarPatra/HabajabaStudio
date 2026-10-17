import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, limit, query } from 'firebase/firestore';
import { ref, onValue, set as rtdbSet, remove as rtdbRemove, get as rtdbGet } from 'firebase/database';
import { getFirebaseFirestore, getFirebaseRealtimeDb } from './firebaseConfig';

export interface ListenerComment {
  id: string;
  authorName: string;
  message: string;
  timestamp: number;
  rating?: number;
  likes?: number;
}

const STORAGE_COMMENTS_KEY = 'habajaba_real_comments_v2';

/**
 * Safely parse a timestamp from various formats (number, string, Firestore Timestamp object)
 */
function parseSafeTimestamp(raw: any): number {
  if (!raw) return Date.now();
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0) return raw;
  if (typeof raw === 'object') {
    if (typeof raw.toMillis === 'function') {
      try {
        return raw.toMillis();
      } catch {}
    }
    if (typeof raw.seconds === 'number') {
      return raw.seconds * 1000;
    }
  }
  if (typeof raw === 'string') {
    const parsedNum = Number(raw);
    if (!isNaN(parsedNum) && parsedNum > 0) return parsedNum;
    const dateParsed = new Date(raw).getTime();
    if (!isNaN(dateParsed) && dateParsed > 0) return dateParsed;
  }
  return Date.now();
}

/**
 * Normalize and sanitize a comment object so it never contains invalid types that crash React
 */
function sanitizeComment(raw: any): ListenerComment | null {
  if (!raw || typeof raw !== 'object') return null;

  const rawId = raw.id ? String(raw.id).trim() : '';
  if (!rawId) return null;

  // Filter out unwanted dummy demo seeds
  if (rawId === 'comm-1' || rawId === 'comm-2' || rawId === 'comm-3') return null;

  const rawAuthor = raw.authorName !== undefined && raw.authorName !== null
    ? String(raw.authorName).trim()
    : 'সঙ্গীতপ্রেমী শ্রোতা';

  if (rawAuthor.includes('সৌমেন')) return null;

  let rawMessage = '';
  if (typeof raw.message === 'string') {
    rawMessage = raw.message.trim();
  } else if (raw.message && typeof raw.message === 'object') {
    rawMessage = String(raw.message.text || raw.message.content || '');
  } else if (raw.message !== undefined && raw.message !== null) {
    rawMessage = String(raw.message).trim();
  }

  if (!rawMessage) return null;

  const rawRating = Number(raw.rating);
  const rating = Number.isFinite(rawRating) && rawRating > 0 && rawRating <= 5
    ? Math.round(rawRating)
    : undefined;

  const likes = Number.isFinite(Number(raw.likes)) && Number(raw.likes) >= 0
    ? Math.round(Number(raw.likes))
    : 0;

  return {
    id: rawId,
    authorName: rawAuthor || 'সঙ্গীতপ্রেমী শ্রোতা',
    message: rawMessage,
    timestamp: parseSafeTimestamp(raw.timestamp),
    rating,
    likes,
  };
}

class FeedbackService {
  private comments: ListenerComment[] = [];
  private listeners = new Set<(comments: ListenerComment[]) => void>();
  private isFirebaseConnected = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private unsubscribeFirestore: (() => void) | null = null;
  private unsubscribeRtdb: (() => void) | null = null;

  constructor() {
    this.loadInitialComments();
    this.initBroadcastChannel();
    this.initFirebaseSync();
  }

  private loadInitialComments() {
    try {
      const stored = localStorage.getItem(STORAGE_COMMENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .map(sanitizeComment)
            .filter((c): c is ListenerComment => c !== null);
          this.comments = sanitized;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local comments:', e);
    }
    this.comments = [];
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('habajaba_feedback_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && Array.isArray(event.data)) {
            this.mergeComments(event.data);
          }
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_COMMENTS_KEY && e.newValue) {
          try {
            const list = JSON.parse(e.newValue);
            if (Array.isArray(list)) {
              this.mergeComments(list);
            }
          } catch {}
        }
      });
    }
  }

  private mergeComments(newItems: any[]) {
    if (!Array.isArray(newItems)) return;

    const map = new Map<string, ListenerComment>();
    // First existing
    this.comments.forEach((c) => {
      if (c && c.id) map.set(c.id, c);
    });

    // Overlay new
    newItems.forEach((raw) => {
      const sanitized = sanitizeComment(raw);
      if (sanitized && sanitized.id) {
        const existing = map.get(sanitized.id);
        map.set(sanitized.id, { ...existing, ...sanitized });
      }
    });

    const combined = Array.from(map.values()).sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    );

    this.comments = combined;
    this.saveLocal();
  }

  public initFirebaseSync() {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    if (this.unsubscribeRtdb) {
      this.unsubscribeRtdb();
      this.unsubscribeRtdb = null;
    }

    // 1. Firebase Realtime Database Listener
    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const feedbackRef = ref(rtdbInstance.rtdb, 'habajaba_feedback');

        // Immediate one-time fetch
        rtdbGet(feedbackRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const val = snapshot.val();
              if (val && typeof val === 'object') {
                const list = Object.keys(val).map((k) => ({
                  ...val[k],
                  id: k,
                }));
                this.mergeComments(list);
                this.isFirebaseConnected = true;
              }
            }
          })
          .catch((err) => {
            console.warn('Initial RTDB feedback get notice:', err);
          });

        // Real-time live listener
        this.unsubscribeRtdb = onValue(
          feedbackRef,
          (snapshot) => {
            const val = snapshot.val();
            if (val && typeof val === 'object') {
              const list = Object.keys(val).map((k) => ({
                ...val[k],
                id: k,
              }));
              this.mergeComments(list);
              this.isFirebaseConnected = true;
            }
          },
          (err) => {
            console.warn('RTDB feedback listener error:', err);
          }
        );
      } catch (e) {
        console.warn('RTDB feedback listener registration error:', e);
      }
    }

    // 2. Firebase Firestore Listener
    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        const feedbackCol = collection(firestoreInstance.db, 'habajaba_feedback');

        // Immediate fetch
        getDocs(query(feedbackCol, limit(50)))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const remote: any[] = [];
              snapshot.forEach((dSnap) => {
                const data = dSnap.data();
                remote.push({ ...data, id: dSnap.id || data.id });
              });
              this.mergeComments(remote);
              this.isFirebaseConnected = true;
            }
          })
          .catch((err) => {
            console.warn('Initial Firestore feedback get notice:', err);
          });

        // Real-time live listener
        this.unsubscribeFirestore = onSnapshot(
          feedbackCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const remote: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                remote.push({
                  ...data,
                  id: docSnap.id || data.id,
                });
              });
              this.mergeComments(remote);
              this.isFirebaseConnected = true;
            }
          },
          (err) => {
            console.warn('Firestore feedback listener notice:', err);
          }
        );
      } catch (e) {
        console.warn('Feedback Firestore sync setup error:', e);
      }
    }
  }

  private saveLocal() {
    try {
      localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(this.comments));
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(this.comments);
      }
    } catch (e) {
      console.warn('Failed to save comments locally:', e);
    }
    this.notify();
  }

  private notify() {
    const list = [...this.comments];
    this.listeners.forEach((fn) => {
      try {
        fn(list);
      } catch (err) {
        console.error('Feedback listener execution error:', err);
      }
    });
  }

  public getComments(): ListenerComment[] {
    return [...this.comments];
  }

  public subscribe(fn: (comments: ListenerComment[]) => void): () => void {
    this.listeners.add(fn);
    try {
      fn(this.comments);
    } catch (err) {
      console.error('Feedback subscribe immediate callback error:', err);
    }
    return () => this.listeners.delete(fn);
  }

  public async addComment(
    authorName: string,
    message: string,
    rating?: number
  ): Promise<ListenerComment> {
    const trimmedAuthor = String(authorName || '').trim() || 'সঙ্গীতপ্রেমী শ্রোতা';
    const trimmedMessage = String(message || '').trim();

    const newComment: ListenerComment = {
      id: `real-comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      authorName: trimmedAuthor,
      message: trimmedMessage,
      timestamp: Date.now(),
      rating: rating && rating > 0 ? Math.min(5, Math.max(1, Math.round(rating))) : undefined,
      likes: 0,
    };

    // Prepend immediately for instant zero-latency UI response
    this.mergeComments([newComment]);

    // 1. Sync to Firebase Realtime Database
    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const commentRef = ref(rtdbInstance.rtdb, `habajaba_feedback/${newComment.id}`);
        rtdbSet(commentRef, newComment).catch((e) =>
          console.warn('Failed to write comment to RTDB:', e)
        );
      } catch {}
    }

    // 2. Sync to Firebase Firestore
    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        setDoc(doc(firestoreInstance.db, 'habajaba_feedback', newComment.id), newComment).catch((e) =>
          console.warn('Failed to write comment to Firestore:', e)
        );
      } catch {}
    }

    return newComment;
  }

  public async deleteComment(commentId: string): Promise<boolean> {
    if (!commentId) return false;
    this.comments = this.comments.filter((c) => c.id !== commentId);
    this.saveLocal();

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const commentRef = ref(rtdbInstance.rtdb, `habajaba_feedback/${commentId}`);
        rtdbRemove(commentRef).catch(() => {});
      } catch {}
    }

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        deleteDoc(doc(firestoreInstance.db, 'habajaba_feedback', commentId)).catch(() => {});
      } catch {}
    }

    return true;
  }

  public async likeComment(commentId: string): Promise<void> {
    const target = this.comments.find((c) => c.id === commentId);
    if (!target) return;

    target.likes = (target.likes || 0) + 1;
    this.saveLocal();

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const likeRef = ref(rtdbInstance.rtdb, `habajaba_feedback/${commentId}/likes`);
        rtdbSet(likeRef, target.likes).catch(() => {});
      } catch {}
    }

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        setDoc(
          doc(firestoreInstance.db, 'habajaba_feedback', commentId),
          { likes: target.likes },
          { merge: true }
        ).catch(() => {});
      } catch {}
    }
  }

  public isConnected(): boolean {
    return this.isFirebaseConnected;
  }
}

export const feedbackService = new FeedbackService();
