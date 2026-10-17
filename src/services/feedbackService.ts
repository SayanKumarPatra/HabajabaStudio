import { collection, doc, setDoc, onSnapshot, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { ref, onValue, set as rtdbSet, get as rtdbGet } from 'firebase/database';
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
          this.comments = parsed.filter(
            (c) =>
              c &&
              c.id &&
              c.id !== 'comm-1' &&
              c.id !== 'comm-2' &&
              c.id !== 'comm-3' &&
              !c.authorName?.includes('সৌমেন')
          );
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
        // Fallback
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

  private mergeComments(newItems: ListenerComment[]) {
    const map = new Map<string, ListenerComment>();
    // First existing
    this.comments.forEach((c) => {
      if (c && c.id) map.set(c.id, c);
    });
    // Overlay new
    newItems.forEach((c) => {
      if (c && c.id) {
        const existing = map.get(c.id);
        map.set(c.id, { ...existing, ...c });
      }
    });

    const combined = Array.from(map.values())
      .filter(
        (c) =>
          c.id !== 'comm-1' &&
          c.id !== 'comm-2' &&
          c.id !== 'comm-3' &&
          !c.authorName?.includes('সৌমেন')
      )
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

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

    // 1. Firebase Realtime Database Listener (Primary live database for Habajaba Studio)
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
                const list: ListenerComment[] = Object.keys(val).map((k) => ({
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
              const list: ListenerComment[] = Object.keys(val).map((k) => ({
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

    // 2. Firebase Firestore Listener (Dual sync for redundancy)
    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        const feedbackCol = collection(firestoreInstance.db, 'habajaba_feedback');

        // Immediate fetch
        getDocs(query(feedbackCol, limit(50)))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const remote: ListenerComment[] = [];
              snapshot.forEach((dSnap) => {
                const data = dSnap.data() as ListenerComment;
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
              const remote: ListenerComment[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data() as ListenerComment;
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
    this.listeners.forEach((fn) => fn(this.comments));
  }

  public getComments(): ListenerComment[] {
    return [...this.comments];
  }

  public subscribe(fn: (comments: ListenerComment[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.comments);
    return () => this.listeners.delete(fn);
  }

  public async addComment(
    authorName: string,
    message: string,
    rating?: number
  ): Promise<ListenerComment> {
    const trimmedAuthor = authorName.trim() || 'সঙ্গীতপ্রেমী শ্রোতা';
    const trimmedMessage = message.trim();

    const newComment: ListenerComment = {
      id: `real-comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      authorName: trimmedAuthor,
      message: trimmedMessage,
      timestamp: Date.now(),
      rating: rating && rating > 0 ? rating : undefined,
      likes: 0,
    };

    // Prepend immediately for instant zero-latency UI response
    this.mergeComments([newComment]);

    // 1. Sync to Firebase Realtime Database
    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const commentRef = ref(rtdbInstance.rtdb, `habajaba_feedback/${newComment.id}`);
        await rtdbSet(commentRef, newComment);
      } catch (e) {
        console.warn('Failed to write comment to RTDB:', e);
      }
    }

    // 2. Sync to Firebase Firestore
    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await setDoc(doc(firestoreInstance.db, 'habajaba_feedback', newComment.id), newComment);
      } catch (e) {
        console.warn('Failed to write comment to Firestore:', e);
      }
    }

    return newComment;
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
        await rtdbSet(likeRef, target.likes);
      } catch {}
    }

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await setDoc(
          doc(firestoreInstance.db, 'habajaba_feedback', commentId),
          { likes: target.likes },
          { merge: true }
        );
      } catch {}
    }
  }

  public isConnected(): boolean {
    return this.isFirebaseConnected;
  }
}

export const feedbackService = new FeedbackService();
