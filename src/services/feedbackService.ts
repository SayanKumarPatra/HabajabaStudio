import { collection, doc, setDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ref, onValue, set as rtdbSet } from 'firebase/database';
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
          // Strictly exclude any legacy mock data
          this.comments = parsed.filter(
            (c) =>
              c.id !== 'comm-1' &&
              c.id !== 'comm-2' &&
              c.id !== 'comm-3' &&
              !c.authorName?.includes('সৌমেন') &&
              !c.authorName?.includes('তানিশা') &&
              !c.authorName?.includes('অনির্বাণ')
          );
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local comments:', e);
    }
    // Strictly zero mock comments — only genuine user submissions!
    this.comments = [];
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('habajaba_feedback_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && Array.isArray(event.data)) {
            this.comments = event.data;
            this.notify();
          }
        };
      } catch (e) {
        // Fallback to storage event
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_COMMENTS_KEY && e.newValue) {
          try {
            this.comments = JSON.parse(e.newValue);
            this.notify();
          } catch {}
        }
      });
    }
  }

  private initFirebaseSync() {
    const firestore = getFirebaseFirestore();
    if (firestore) {
      try {
        const q = query(
          collection(firestore.db, 'habajaba_feedback'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const remote: ListenerComment[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data() as ListenerComment;
                // Exclude any mock items
                if (
                  data.id !== 'comm-1' &&
                  data.id !== 'comm-2' &&
                  data.id !== 'comm-3' &&
                  !data.authorName?.includes('সৌমেন')
                ) {
                  remote.push({
                    ...data,
                    id: docSnap.id || data.id,
                  });
                }
              });
              this.comments = remote;
              this.saveLocal();
              this.isFirebaseConnected = true;
            }
          },
          (err) => {
            console.warn('Firestore feedback listener notice:', err);
          }
        );
        return;
      } catch (e) {
        console.warn('Feedback sync setup error:', e);
      }
    }

    const rtdb = getFirebaseRealtimeDb();
    if (rtdb) {
      try {
        const feedbackRef = ref(rtdb.rtdb, 'habajaba_feedback');
        onValue(feedbackRef, (snapshot) => {
          const val = snapshot.val();
          if (val && typeof val === 'object') {
            const list: ListenerComment[] = Object.values(val);
            const filtered = list.filter(
              (c) =>
                c.id !== 'comm-1' &&
                c.id !== 'comm-2' &&
                c.id !== 'comm-3' &&
                !c.authorName?.includes('সৌমেন')
            );
            filtered.sort((a, b) => b.timestamp - a.timestamp);
            this.comments = filtered;
            this.saveLocal();
            this.isFirebaseConnected = true;
          }
        });
      } catch (e) {
        console.warn('RTDB feedback listener error:', e);
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
      id: `real-comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorName: trimmedAuthor,
      message: trimmedMessage,
      timestamp: Date.now(),
      rating: rating && rating > 0 ? rating : undefined,
      likes: 0,
    };

    // Prepend immediately for instant zero-latency UI response
    this.comments = [newComment, ...this.comments];
    this.saveLocal();

    // Sync to Cloud if Firebase is present
    const firestore = getFirebaseFirestore();
    if (firestore) {
      try {
        await setDoc(doc(firestore.db, 'habajaba_feedback', newComment.id), newComment);
      } catch (e) {
        console.warn('Failed to write comment to Firestore:', e);
      }
    }

    const rtdb = getFirebaseRealtimeDb();
    if (rtdb) {
      try {
        const commentRef = ref(rtdb.rtdb, `habajaba_feedback/${newComment.id}`);
        await rtdbSet(commentRef, newComment);
      } catch (e) {
        console.warn('Failed to write comment to RTDB:', e);
      }
    }

    return newComment;
  }

  public async likeComment(commentId: string): Promise<void> {
    const target = this.comments.find((c) => c.id === commentId);
    if (!target) return;

    target.likes = (target.likes || 0) + 1;
    this.comments = [...this.comments];
    this.saveLocal();

    const firestore = getFirebaseFirestore();
    if (firestore) {
      try {
        await setDoc(
          doc(firestore.db, 'habajaba_feedback', commentId),
          { likes: target.likes },
          { merge: true }
        );
      } catch {}
    }
  }
}

export const feedbackService = new FeedbackService();
