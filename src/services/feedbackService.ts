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

const STORAGE_COMMENTS_KEY = 'habajaba_community_comments_v1';

const DEFAULT_COMMENTS: ListenerComment[] = [
  {
    id: 'comm-1',
    authorName: 'সৌমেন মুখার্জী',
    message: 'অসাধারণ স্টুডিও সাউন্ড কোয়ালিটি! বিশেষ করে অ্যাকোস্টিক ট্র্যাকগুলো এক নিশ্বাসে শুনলাম। এমন উদ্যোগ বাংলায় বিরল।',
    timestamp: Date.now() - 3600000 * 2,
    rating: 5,
    likes: 14,
  },
  {
    id: 'comm-2',
    authorName: 'তানিশা হক',
    message: 'মোবাইল থেকে খুব স্মুথ চলছে, কোনো ল্যাগ নেই। হাবাজ্যাবা স্টুডিও লাইভ এর ইউটিউব চ্যানেলও সাবস্ক্রাইব করেছি!',
    timestamp: Date.now() - 3600000 * 5,
    rating: 5,
    likes: 9,
  },
  {
    id: 'comm-3',
    authorName: 'অনির্বাণ ঘোষাল',
    message: 'ক্যাসেট প্লেয়ার আর অরিজিনাল সাউন্ডট্র্যাক দুর্দান্ত অভিজ্ঞতা। নতুন আরও গান প্রকাশ করার অনুরোধ রইল।',
    timestamp: Date.now() - 3600000 * 12,
    rating: 5,
    likes: 21,
  },
];

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.comments = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local comments:', e);
    }
    this.comments = [...DEFAULT_COMMENTS];
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
                remote.push({
                  ...data,
                  id: docSnap.id || data.id,
                });
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
            list.sort((a, b) => b.timestamp - a.timestamp);
            this.comments = list;
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
    rating = 5
  ): Promise<ListenerComment> {
    const trimmedAuthor = authorName.trim() || 'সঙ্গীতপ্রেমী শ্রোতা';
    const trimmedMessage = message.trim();

    const newComment: ListenerComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorName: trimmedAuthor,
      message: trimmedMessage,
      timestamp: Date.now(),
      rating,
      likes: 1,
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
