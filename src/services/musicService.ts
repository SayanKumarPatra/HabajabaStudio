import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDoc, getDocs } from 'firebase/firestore';
import { ref, onValue, set as rtdbSet, remove as rtdbRemove, get as rtdbGet } from 'firebase/database';
import rawMusicData from '../data/music.json';
import { Album, Artist, BannerSlide, BrandingConfig, HeroBannerConfig, Playlist, Track } from '../types/music';
import { getFirebaseFirestore, getFirebaseRealtimeDb, getActiveFirebaseConfig } from './firebaseConfig';
import { offlineCacheService } from './offlineCacheService';

const STORAGE_CATALOG_KEY = 'habajaba_admin_catalog_v5';
const STORAGE_CATALOG_BACKUP_KEY = 'habajaba_admin_catalog_backup_v5';
const STORAGE_DELETED_TRACKS_KEY = 'habajaba_deleted_tracks_v5';
const STORAGE_BRANDING_KEY = 'habajaba_admin_branding_v3';
const STORAGE_SLIDING_BANNERS_KEY = 'habajaba_sliding_banners_v3';

// Automatic purge of obsolete legacy caches (_v1, _v2, _v3, _v4) so browser starts 100% fresh
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'habajaba_admin_catalog_v2',
      'habajaba_admin_catalog_backup_v2',
      'habajaba_deleted_tracks_v2',
      'habajaba_admin_catalog_v1',
      'habajaba_admin_catalog_backup_v1',
      'habajaba_admin_catalog_v3',
      'habajaba_admin_catalog_backup_v3',
      'habajaba_deleted_tracks_v3',
      'habajaba_admin_catalog_v4',
      'habajaba_admin_catalog_backup_v4',
      'habajaba_deleted_tracks_v4',
      'habajaba_initial_seed_done',
      'habajaba_cached_tracks',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
    offlineCacheService.clearAllCache().catch(() => {});
  } catch {}
}

export const defaultSlidingBanners: BannerSlide[] = [
  {
    id: 'slide-1',
    imageUrl: '/banner-hero.svg',
    title: 'Habajaba Studio LIVE',
    subtitle: 'অরিজিনাল বাংলা লাইভ স্টুডিও সেশন',
  },
  {
    id: 'slide-2',
    imageUrl: '/banner-default.svg',
    title: 'Acoustic Master Sessions',
    subtitle: 'হাই-ফিডেলিটি লাইভ অ্যাকোস্টিক সাউন্ড',
  },
  {
    id: 'slide-3',
    imageUrl: '/banner-hero.svg',
    title: 'Bengali Original Sound Master',
    subtitle: 'ডিজিটাল হোম অফ অরিজিনাল বাংলা মিউজিক',
  },
  {
    id: 'slide-4',
    imageUrl: '/banner-default.svg',
    title: 'Habajaba Live Production',
    subtitle: 'বাংলা গানের স্বতন্ত্র স্টুডিও এক্সপেরিয়েন্স',
  },
];

interface CatalogState {
  banner: HeroBannerConfig;
  slidingBanners: BannerSlide[];
  branding: BrandingConfig;
  tracks: Track[];
  albums: Album[];
  playlists: Playlist[];
  artists: Artist[];
}

const defaultState: CatalogState = {
  banner: (rawMusicData as any).banner || {
    title: 'Habajaba Studio LIVE',
    subtitle: 'অরিজিনাল বাংলা গান · Original Bengali Music',
    bannerUrl: '/banner-default.svg',
    featuredTrackId: '',
  },
  slidingBanners: defaultSlidingBanners,
  branding: {
    logoUrl: '',
    studioName: 'Habajaba Studio LIVE',
    tagline: 'অরিজিনাল বাংলা মিউজিক',
    youtubeChannelUrl: 'https://www.youtube.com/@HabajabaStudioLive',
    youtubeChannelName: 'Habajaba Studio LIVE',
    youtubeSubscriberText: 'অফিসিয়াল ইউটিউব চ্যানেল',
  },
  tracks: [],
  albums: [],
  playlists: (rawMusicData.playlists as Playlist[]) || [],
  artists: (rawMusicData.artists as Artist[]) || [],
};

function getDeletedTrackIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_TRACKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
}

function saveDeletedTrackIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_DELETED_TRACKS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function loadState(): CatalogState {
  try {
    const saved = localStorage.getItem(STORAGE_CATALOG_KEY);
    const backup = localStorage.getItem(STORAGE_CATALOG_BACKUP_KEY);
    const savedBranding = localStorage.getItem(STORAGE_BRANDING_KEY);
    const savedSlidingBanners = localStorage.getItem(STORAGE_SLIDING_BANNERS_KEY);
    const branding = savedBranding ? JSON.parse(savedBranding) : defaultState.branding;
    const slidingBanners = savedSlidingBanners ? JSON.parse(savedSlidingBanners) : defaultState.slidingBanners;

    let loadedTracks: Track[] = [];

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.tracks)) {
        loadedTracks = parsed.tracks;
      }
    }

    // Filter out explicitly deleted tracks and invalid entries
    const deletedIds = getDeletedTrackIds();
    loadedTracks = loadedTracks.filter((t) => t && t.id && !deletedIds.has(t.id));

    // Deduplicate loaded tracks by ID and by YouTube ID / Audio URL
    const seenIds = new Set<string>();
    const seenYt = new Set<string>();
    const seenUrls = new Set<string>();
    const cleanDeduplicatedTracks: Track[] = [];

    for (const t of loadedTracks) {
      if (!t || !t.id || seenIds.has(t.id)) continue;
      if (t.youtubeId && seenYt.has(t.youtubeId)) continue;
      if (t.audioUrl && seenUrls.has(t.audioUrl)) continue;

      seenIds.add(t.id);
      if (t.youtubeId) seenYt.add(t.youtubeId);
      if (t.audioUrl) seenUrls.add(t.audioUrl);
      cleanDeduplicatedTracks.push(t);
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        banner: parsed.banner || defaultState.banner,
        slidingBanners: Array.isArray(parsed.slidingBanners) && parsed.slidingBanners.length > 0 ? parsed.slidingBanners : slidingBanners,
        branding: parsed.branding || branding,
        tracks: cleanDeduplicatedTracks,
        albums: Array.isArray(parsed.albums) ? parsed.albums : [],
        playlists: Array.isArray(parsed.playlists) ? parsed.playlists : defaultState.playlists,
        artists: Array.isArray(parsed.artists) ? parsed.artists : defaultState.artists,
      };
    }
  } catch (e) {
    console.warn('Failed to load catalog from localStorage:', e);
  }
  return defaultState;
}

let catalogState: CatalogState = loadState();
const listeners = new Set<() => void>();
let isFirestoreInitialized = false;
let unsubscribeSongs: (() => void) | null = null;
let unsubscribeBanner: (() => void) | null = null;
let unsubscribeBranding: (() => void) | null = null;

let unsubscribeSlidingBanners: (() => void) | null = null;
let unsubscribeArtists: (() => void) | null = null;

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function saveStateLocally() {
  try {
    localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(catalogState));
    if (catalogState.tracks.length > 0) {
      localStorage.setItem(STORAGE_CATALOG_BACKUP_KEY, JSON.stringify({
        tracks: catalogState.tracks,
        updatedAt: Date.now(),
      }));
    } else {
      localStorage.removeItem(STORAGE_CATALOG_BACKUP_KEY);
    }
    if (catalogState.branding) {
      localStorage.setItem(STORAGE_BRANDING_KEY, JSON.stringify(catalogState.branding));
    }
    if (catalogState.slidingBanners) {
      localStorage.setItem(STORAGE_SLIDING_BANNERS_KEY, JSON.stringify(catalogState.slidingBanners));
    }
  } catch (e) {
    console.warn('Failed to save catalog to localStorage:', e);
  }

  // Asynchronously sync albums, artists, tracks, and image metadata to IndexedDB
  if (typeof window !== 'undefined') {
    offlineCacheService.syncCatalog(
      MusicService.getAlbums(),
      MusicService.getArtists(),
      catalogState.tracks
    ).catch(() => {});
  }

  notifyListeners();
}

// Background startup: register Service Worker and prime IndexedDB
if (typeof window !== 'undefined') {
  offlineCacheService.registerServiceWorker().catch(() => {});
}

// Helper to sanitize objects for Firebase Firestore and RTDB (removes undefined fields which Firestore rejects)
export function cleanForFirebase<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanForFirebase(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// Strict Intelligent Track Merging: Guarantees zero duplicate songs
function mergeRemoteTracks(remoteTracks: Track[]) {
  if (!remoteTracks) return;
  const deletedIds = getDeletedTrackIds();

  // Deduplication map by primary ID
  const trackMap = new Map<string, Track>();
  // Helper maps for YouTube ID and Audio URL to prevent duplicates with different IDs
  const ytToId = new Map<string, string>();
  const urlToId = new Map<string, string>();

  // 1. First add current local tracks that are not deleted
  catalogState.tracks.forEach((t) => {
    if (t && t.id && !deletedIds.has(t.id)) {
      trackMap.set(t.id, t);
      if (t.youtubeId) ytToId.set(t.youtubeId, t.id);
      if (t.audioUrl) urlToId.set(t.audioUrl, t.id);
    }
  });

  // 2. Add or update remote tracks
  remoteTracks.forEach((r) => {
    if (!r || !r.id || deletedIds.has(r.id)) return;

    // Check if this song already exists under another ID (by YouTube ID or audioUrl)
    const existingIdByYt = r.youtubeId ? ytToId.get(r.youtubeId) : undefined;
    const existingIdByUrl = r.audioUrl ? urlToId.get(r.audioUrl) : undefined;
    const targetId = existingIdByYt || existingIdByUrl || r.id;

    const existing = trackMap.get(targetId);
    const mergedTrack = existing ? { ...existing, ...r, id: targetId } : r;
    trackMap.set(targetId, mergedTrack);

    if (mergedTrack.youtubeId) ytToId.set(mergedTrack.youtubeId, targetId);
    if (mergedTrack.audioUrl) urlToId.set(mergedTrack.audioUrl, targetId);
  });

  catalogState.tracks = Array.from(trackMap.values());
  saveStateLocally();
  notifyListeners();

  // 3. If local catalog has tracks not yet saved in remote database, push them to remote in background
  const remoteIdSet = new Set(remoteTracks.map((r) => r.id));
  const missingFromRemote = catalogState.tracks.filter((t) => !remoteIdSet.has(t.id));
  if (missingFromRemote.length > 0) {
    pushTracksToRemote(missingFromRemote);
  }
}

// Background helper to ensure all tracks exist in remote database without blocking UI
function pushTracksToRemote(tracksToPush: Track[]) {
  if (!tracksToPush || tracksToPush.length === 0) return;
  const firestoreInstance = getFirebaseFirestore();
  const rtdbInstance = getFirebaseRealtimeDb();

  if (firestoreInstance) {
    try {
      // Chunk batches in groups of 400 (Firestore max limit is 500)
      const chunkSize = 400;
      for (let i = 0; i < tracksToPush.length; i += chunkSize) {
        const chunk = tracksToPush.slice(i, i + chunkSize);
        const batch = writeBatch(firestoreInstance.db);
        for (const t of chunk) {
          batch.set(doc(firestoreInstance.db, 'habajaba_songs', t.id), cleanForFirebase(t));
        }
        batch.commit().catch((e) => console.warn('Background Firestore track sync notice:', e));
      }
    } catch (err) {
      console.warn('Firestore push error:', err);
    }
  }

  if (rtdbInstance) {
    try {
      for (const t of tracksToPush) {
        rtdbSet(ref(rtdbInstance.rtdb, `habajaba_songs/${t.id}`), cleanForFirebase(t)).catch(() => {});
      }
    } catch {}
  }
}

function mergeRemoteArtists(remotes: Artist[]) {
  if (!remotes || remotes.length === 0) return;
  const map = new Map<string, Artist>();
  catalogState.artists.forEach((a) => {
    if (a && a.name && a.name.trim()) {
      map.set(a.name.trim().toLowerCase(), a);
    }
  });
  remotes.forEach((r) => {
    if (r && r.name && r.name.trim()) {
      const key = r.name.trim().toLowerCase();
      const existing = map.get(key);
      map.set(key, existing ? { ...existing, ...r, id: existing.id || r.id } : r);
    }
  });
  catalogState.artists = Array.from(map.values());
  saveStateLocally();
}

// Set up real-time Firebase Firestore synchronization
export function initFirestoreSync() {
  const firestoreInstance = getFirebaseFirestore();
  if (!firestoreInstance) {
    return false;
  }

  const { db } = firestoreInstance;
  if (isFirestoreInitialized) return true;

  try {
    // 1. Real-time listener for Songs collection
    const songsCol = collection(db, 'habajaba_songs');
    unsubscribeSongs = onSnapshot(
      songsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteTracks: Track[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Track;
            remoteTracks.push({
              ...data,
              id: docSnap.id || data.id,
            });
          });
          // Intelligently merge remote tracks without ever wiping out local tracks
          mergeRemoteTracks(remoteTracks);
        } else if (catalogState.tracks.length > 0 && !localStorage.getItem('habajaba_initial_seed_done')) {
          localStorage.setItem('habajaba_initial_seed_done', 'true');
          pushTracksToRemote(catalogState.tracks);
        }
      },
      (error) => {
        console.warn('Firestore tracks listener notice (local cache active):', error);
      }
    );

    // 2. Real-time listener for Hero Banner document
    const bannerDoc = doc(db, 'habajaba_settings', 'banner');
    unsubscribeBanner = onSnapshot(
      bannerDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as HeroBannerConfig;
          if (data && data.bannerUrl) {
            catalogState.banner = data;
            saveStateLocally();
          }
        } else if (catalogState.banner && catalogState.banner.bannerUrl) {
          const inst = getFirebaseFirestore();
          if (inst) {
            setDoc(doc(inst.db, 'habajaba_settings', 'banner'), catalogState.banner).catch(() => {});
          }
        }
      },
      (error) => {
        console.warn('Firestore banner listener error:', error);
      }
    );

    // 3. Real-time listener for Branding document (custom logo, YouTube, etc.)
    const brandingDoc = doc(db, 'habajaba_settings', 'branding');
    unsubscribeBranding = onSnapshot(
      brandingDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as BrandingConfig;
          if (data) {
            catalogState.branding = data;
            saveStateLocally();
          }
        }
      },
      (error) => {
        console.warn('Firestore branding listener error:', error);
      }
    );

    // 4. Real-time listener for 4 Sliding Banners document
    const slidingBannersDoc = doc(db, 'habajaba_settings', 'sliding_banners');
    getDoc(slidingBannersDoc)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as { banners?: BannerSlide[] };
          if (data && Array.isArray(data.banners) && data.banners.length > 0) {
            catalogState.slidingBanners = data.banners;
            saveStateLocally();
          }
        }
      })
      .catch(() => {});

    unsubscribeSlidingBanners = onSnapshot(
      slidingBannersDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as { banners?: BannerSlide[] };
          if (data && Array.isArray(data.banners) && data.banners.length > 0) {
            catalogState.slidingBanners = data.banners;
            saveStateLocally();
          }
        }
      },
      (error) => {
        console.warn('Firestore sliding banners listener error:', error);
      }
    );

    // 5. Real-time listener for Artists collection
    const artistsCol = collection(db, 'habajaba_artists');
    getDocs(artistsCol)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const remoteArtists: Artist[] = [];
          snapshot.forEach((dSnap) => {
            const data = dSnap.data() as Artist;
            remoteArtists.push({
              ...data,
              id: dSnap.id || data.id,
            });
          });
          if (remoteArtists.length > 0) {
            mergeRemoteArtists(remoteArtists);
          }
        }
      })
      .catch(() => {});

    unsubscribeArtists = onSnapshot(
      artistsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteArtists: Artist[] = [];
          snapshot.forEach((dSnap) => {
            const data = dSnap.data() as Artist;
            remoteArtists.push({
              ...data,
              id: dSnap.id || data.id,
            });
          });
          if (remoteArtists.length > 0) {
            mergeRemoteArtists(remoteArtists);
          }
        }
      },
      (error) => {
        console.warn('Firestore artists listener error:', error);
      }
    );

    isFirestoreInitialized = true;
    return true;
  } catch (err) {
    console.error('Failed to setup Firestore listeners:', err);
    return false;
  }
}

let isRtdbInitialized = false;

// Set up real-time Firebase Realtime Database synchronization
export function initRealtimeDbSync() {
  const rtdbInstance = getFirebaseRealtimeDb();
  if (!rtdbInstance) return false;
  if (isRtdbInitialized) return true;

  try {
    const { rtdb } = rtdbInstance;

    // 1. Real-time listener for Songs in Realtime Database
    const songsRef = ref(rtdb, 'habajaba_songs');
    onValue(songsRef, (snapshot) => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        const remoteTracks: Track[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => ({
              ...val[k],
              id: val[k]?.id || k,
            }));
        if (remoteTracks.length > 0) {
          mergeRemoteTracks(remoteTracks);
        }
      } else if (val === null && !localStorage.getItem('habajaba_initial_seed_done') && catalogState.tracks.length > 0) {
        localStorage.setItem('habajaba_initial_seed_done', 'true');
        pushTracksToRemote(catalogState.tracks);
      }
    });

    // 2. Real-time listener for Banner in RTDB
    const bannerRef = ref(rtdb, 'habajaba_settings/banner');
    onValue(bannerRef, (snapshot) => {
      const val = snapshot.val() as HeroBannerConfig | null;
      if (val && val.bannerUrl) {
        catalogState.banner = val;
        saveStateLocally();
      }
    });

    // 3. Real-time listener for Branding in RTDB
    const brandingRef = ref(rtdb, 'habajaba_settings/branding');
    onValue(brandingRef, (snapshot) => {
      const val = snapshot.val() as BrandingConfig | null;
      if (val) {
        catalogState.branding = val;
        saveStateLocally();
      }
    });

    // 4. Real-time listener for Sliding Banners in RTDB
    const slidingRef = ref(rtdb, 'habajaba_settings/sliding_banners');
    const handleSlidingSnapshot = (snapshot: any) => {
      const val = snapshot.val();
      if (val) {
        const list = Array.isArray(val) ? val : Array.isArray(val.banners) ? val.banners : null;
        if (list && list.length > 0) {
          catalogState.slidingBanners = list;
          saveStateLocally();
        }
      }
    };
    rtdbGet(slidingRef).then(handleSlidingSnapshot).catch(() => {});
    onValue(slidingRef, handleSlidingSnapshot);

    // 5. Real-time listener for Artists in RTDB
    const artistsRef = ref(rtdb, 'habajaba_artists');
    const handleArtistsSnapshot = (snapshot: any) => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        const remoteArtists: Artist[] = Object.keys(val).map((k) => ({
          ...val[k],
          id: k,
        }));
        if (remoteArtists.length > 0) {
          mergeRemoteArtists(remoteArtists);
        }
      }
    };
    rtdbGet(artistsRef).then(handleArtistsSnapshot).catch(() => {});
    onValue(artistsRef, handleArtistsSnapshot);

    isRtdbInitialized = true;
    return true;
  } catch (err) {
    console.error('Failed to setup Realtime Database listeners:', err);
    return false;
  }
}

// Auto-initialize both sync engines on startup if config exists
initFirestoreSync();
initRealtimeDbSync();

export const MusicService = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  isFirebaseLive(): boolean {
    return !!getActiveFirebaseConfig() && (isFirestoreInitialized || isRtdbInitialized);
  },

  reconnectFirebase(): boolean {
    if (unsubscribeSongs) unsubscribeSongs();
    if (unsubscribeBanner) unsubscribeBanner();
    if (unsubscribeBranding) unsubscribeBranding();
    if (unsubscribeSlidingBanners) unsubscribeSlidingBanners();
    if (unsubscribeArtists) unsubscribeArtists();
    isFirestoreInitialized = false;
    isRtdbInitialized = false;
    const fsOk = initFirestoreSync();
    const rtdbOk = initRealtimeDbSync();
    return fsOk || rtdbOk;
  },

  getHeroBanner(): HeroBannerConfig {
    return catalogState.banner;
  },

  getSlidingBanners(): BannerSlide[] {
    if (catalogState.slidingBanners && catalogState.slidingBanners.length > 0) {
      return catalogState.slidingBanners;
    }
    return defaultSlidingBanners;
  },

  async saveSlidingBanners(banners: BannerSlide[]) {
    catalogState.slidingBanners = banners;
    saveStateLocally();

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await setDoc(doc(firestoreInstance.db, 'habajaba_settings', 'sliding_banners'), { banners });
      } catch (e) {
        console.warn('Failed to sync sliding banners to Firestore:', e);
      }
    }

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const bannersRef = ref(rtdbInstance.rtdb, 'habajaba_settings/sliding_banners');
        await rtdbSet(bannersRef, { banners });
      } catch (e) {
        console.warn('Failed to sync sliding banners to RTDB:', e);
      }
    }
  },

  async updateSlidingBanner(index: number, updated: Partial<BannerSlide>) {
    const current = [...this.getSlidingBanners()];
    if (current[index]) {
      current[index] = { ...current[index], ...updated };
    } else {
      current[index] = {
        id: `slide-${index + 1}`,
        imageUrl: updated.imageUrl || '/banner-default.svg',
        ...updated,
      };
    }
    await this.saveSlidingBanners(current);
  },

  async addSlidingBanner(banner?: Partial<BannerSlide>): Promise<BannerSlide> {
    const current = [...this.getSlidingBanners()];
    const newSlide: BannerSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      imageUrl: banner?.imageUrl || '/banner-default.svg',
      title: banner?.title || `Banner ${current.length + 1}`,
      subtitle: banner?.subtitle || 'Habajaba Studio LIVE',
      linkUrl: banner?.linkUrl || '',
    };
    const updated = [...current, newSlide];
    await this.saveSlidingBanners(updated);
    return newSlide;
  },

  async deleteSlidingBanner(idOrIndex: string | number) {
    let current = [...this.getSlidingBanners()];
    if (typeof idOrIndex === 'number') {
      current = current.filter((_, idx) => idx !== idOrIndex);
    } else {
      current = current.filter((b) => b.id !== idOrIndex);
    }
    if (current.length === 0) {
      current = [defaultSlidingBanners[0]];
    }
    await this.saveSlidingBanners(current);
  },

  async reorderSlidingBanners(fromIndex: number, toIndex: number) {
    const current = [...this.getSlidingBanners()];
    if (fromIndex < 0 || fromIndex >= current.length || toIndex < 0 || toIndex >= current.length) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    await this.saveSlidingBanners(current);
  },

  async saveHeroBanner(banner: HeroBannerConfig) {
    catalogState.banner = banner;
    saveStateLocally();

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await setDoc(doc(firestoreInstance.db, 'habajaba_settings', 'banner'), banner);
      } catch (e) {
        console.warn('Failed to sync banner to Firestore:', e);
      }
    }

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const bannerRef = ref(rtdbInstance.rtdb, 'habajaba_settings/banner');
        await rtdbSet(bannerRef, banner);
      } catch (e) {
        console.warn('Failed to sync banner to Realtime Database:', e);
      }
    }
  },

  async saveArtist(artist: Artist): Promise<{ success: boolean; artist: Artist }> {
    const trimmedName = (artist.name || '').trim();
    const existingIndex = catalogState.artists.findIndex(
      (a) => (artist.id && a.id === artist.id) || (trimmedName && a.name.trim().toLowerCase() === trimmedName.toLowerCase())
    );

    let finalArtist: Artist;
    if (existingIndex >= 0) {
      const oldArtist = catalogState.artists[existingIndex];
      finalArtist = {
        ...oldArtist,
        ...artist,
        id: oldArtist.id || artist.id || `artist-${Date.now()}`,
      };
      catalogState.artists[existingIndex] = finalArtist;
      if (oldArtist.name.trim().toLowerCase() !== finalArtist.name.trim().toLowerCase()) {
        catalogState.tracks = catalogState.tracks.map((t) =>
          t.artist.trim().toLowerCase() === oldArtist.name.trim().toLowerCase()
            ? { ...t, artist: finalArtist.name }
            : t
        );
      }
    } else {
      finalArtist = {
        ...artist,
        id: artist.id || `artist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      catalogState.artists.push(finalArtist);
    }
    saveStateLocally();

    const safeDocId = (finalArtist.id || `artist-${Date.now()}`).replace(/[.#$\[\]/]/g, '_');

    let syncedRemote = false;
    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await setDoc(doc(firestoreInstance.db, 'habajaba_artists', safeDocId), finalArtist);
        syncedRemote = true;
      } catch (e) {
        console.warn('Failed to sync artist to Firestore:', e);
      }
    }

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const artistRef = ref(rtdbInstance.rtdb, `habajaba_artists/${safeDocId}`);
        await rtdbSet(artistRef, finalArtist);
        syncedRemote = true;
      } catch (e) {
        console.warn('Failed to sync artist to RTDB:', e);
      }
    }

    return { success: syncedRemote || true, artist: finalArtist };
  },

  async deleteArtist(id: string) {
    catalogState.artists = catalogState.artists.filter((a) => a.id !== id);
    saveStateLocally();
    notifyListeners();

    // Purge from IndexedDB
    offlineCacheService.deleteArtist(id).catch(() => {});

    const firestoreInstance = getFirebaseFirestore();
    const rtdbInstance = getFirebaseRealtimeDb();
    const deleteTasks: Promise<any>[] = [];

    if (firestoreInstance) {
      deleteTasks.push(
        deleteDoc(doc(firestoreInstance.db, 'habajaba_artists', id)).catch((e) =>
          console.warn('Failed to delete artist from Firestore:', e)
        )
      );
    }
    if (rtdbInstance) {
      deleteTasks.push(
        rtdbRemove(ref(rtdbInstance.rtdb, `habajaba_artists/${id}`)).catch((e) =>
          console.warn('Failed to delete artist from RTDB:', e)
        )
      );
    }
    if (deleteTasks.length > 0) {
      Promise.allSettled(deleteTasks);
    }
  },

  getBranding(): BrandingConfig {
    return catalogState.branding || defaultState.branding;
  },

  async saveBranding(branding: BrandingConfig) {
    catalogState.branding = branding;
    saveStateLocally();

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await setDoc(doc(firestoreInstance.db, 'habajaba_settings', 'branding'), branding);
      } catch (e) {
        console.warn('Failed to sync branding to Firestore:', e);
      }
    }

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const brandingRef = ref(rtdbInstance.rtdb, 'habajaba_settings/branding');
        await rtdbSet(brandingRef, branding);
      } catch (e) {
        console.warn('Failed to sync branding to Realtime Database:', e);
      }
    }
  },

  getAllTracks(
    sortBy: 'newest' | 'title' | 'artist' = 'newest',
    includeUnpublished = false
  ): Track[] {
    let list = catalogState.tracks;
    if (!includeUnpublished) {
      list = list.filter((t) => t.published);
    }
    const cloned = [...list];
    if (sortBy === 'newest') {
      return cloned.sort(
        (a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime()
      );
    }
    if (sortBy === 'title') {
      return cloned.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'artist') {
      return cloned.sort((a, b) => a.artist.localeCompare(b.artist));
    }
    return cloned;
  },

  getFeaturedTracks(): Track[] {
    return catalogState.tracks.filter((t) => t.published && t.featured);
  },

  getLatestReleases(limit = 6): Track[] {
    return this.getAllTracks('newest', false).slice(0, limit);
  },

  getTrackById(id: string): Track | undefined {
    return catalogState.tracks.find((t) => t.id === id);
  },

  getTracksByIds(ids: string[]): Track[] {
    return ids
      .map((id) => catalogState.tracks.find((t) => t.id === id))
      .filter((t): t is Track => t !== undefined);
  },

  async addTrack(track: Track) {
    // If it was previously marked as deleted, remove it from deleted list
    const deletedIds = getDeletedTrackIds();
    if (deletedIds.has(track.id)) {
      deletedIds.delete(track.id);
      saveDeletedTrackIds(deletedIds);
    }

    // Strict deduplication: check if track with same ID, same youtubeId, or same audioUrl exists
    const existingIndex = catalogState.tracks.findIndex(
      (t) =>
        t.id === track.id ||
        (t.youtubeId && track.youtubeId && t.youtubeId === track.youtubeId) ||
        (t.audioUrl && track.audioUrl && t.audioUrl.trim().toLowerCase() === track.audioUrl.trim().toLowerCase())
    );

    if (existingIndex !== -1) {
      // Update in place instead of creating a duplicate
      const merged = { ...catalogState.tracks[existingIndex], ...track, id: catalogState.tracks[existingIndex].id };
      catalogState.tracks[existingIndex] = merged;
    } else {
      catalogState.tracks = [track, ...catalogState.tracks];
    }

    // If track has an artist not in the artists list, add and persist artist
    const trimmedArtistName = (track.artist || '').trim();
    if (
      trimmedArtistName &&
      !catalogState.artists.some((a) => a.name.toLowerCase().trim() === trimmedArtistName.toLowerCase())
    ) {
      const newArtist: Artist = {
        id: `artist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmedArtistName,
        avatarUrl: track.coverUrl || '/logo.svg',
        role: 'Bengali Artist',
        bio: `Artist recorded with Habajaba Studio LIVE.`,
      };
      this.saveArtist(newArtist).catch(() => {});
    }

    saveStateLocally();
    notifyListeners();

    // Immediately persist this track to Firestore and RTDB
    const firestoreInstance = getFirebaseFirestore();
    const rtdbInstance = getFirebaseRealtimeDb();
    const cleanT = cleanForFirebase(track);

    if (firestoreInstance) {
      setDoc(doc(firestoreInstance.db, 'habajaba_songs', track.id), cleanT).catch((e) =>
        console.warn('Failed to add track to Firestore:', e)
      );
    }
    if (rtdbInstance) {
      rtdbSet(ref(rtdbInstance.rtdb, `habajaba_songs/${track.id}`), cleanT).catch((e) =>
        console.warn('Failed to add track to Realtime Database:', e)
      );
    }

    // Also push entire catalog in background to ensure complete remote persistence
    pushTracksToRemote(catalogState.tracks);
  },

  async updateTrack(updated: Track) {
    // Find track by ID or by matching YouTube ID / audioUrl
    let found = false;
    catalogState.tracks = catalogState.tracks.map((t) => {
      if (
        t.id === updated.id ||
        (t.youtubeId && updated.youtubeId && t.youtubeId === updated.youtubeId) ||
        (t.audioUrl && updated.audioUrl && t.audioUrl.trim().toLowerCase() === updated.audioUrl.trim().toLowerCase())
      ) {
        found = true;
        return { ...t, ...updated, id: t.id };
      }
      return t;
    });

    if (!found) {
      catalogState.tracks = [updated, ...catalogState.tracks];
    }

    saveStateLocally();
    notifyListeners();

    const firestoreInstance = getFirebaseFirestore();
    const rtdbInstance = getFirebaseRealtimeDb();
    const syncTasks: Promise<any>[] = [];
    const cleanUpdated = cleanForFirebase(updated);

    if (firestoreInstance) {
      syncTasks.push(
        setDoc(doc(firestoreInstance.db, 'habajaba_songs', updated.id), cleanUpdated).catch((e) =>
          console.warn('Failed to update track in Firestore:', e)
        )
      );
    }
    if (rtdbInstance) {
      syncTasks.push(
        rtdbSet(ref(rtdbInstance.rtdb, `habajaba_songs/${updated.id}`), cleanUpdated).catch((e) =>
          console.warn('Failed to update track in Realtime Database:', e)
        )
      );
    }
    if (syncTasks.length > 0) {
      Promise.allSettled(syncTasks);
    }
  },

  async deleteTrack(id: string) {
    // Record deletion so background remote listeners never re-add it
    const deletedIds = getDeletedTrackIds();
    deletedIds.add(id);

    // Find if the track has a youtubeId or audioUrl to also mark as deleted
    const targetTrack = catalogState.tracks.find((t) => t.id === id);
    if (targetTrack?.youtubeId) deletedIds.add(targetTrack.youtubeId);

    saveDeletedTrackIds(deletedIds);

    catalogState.tracks = catalogState.tracks.filter((t) => t.id !== id);
    if (catalogState.banner.featuredTrackId === id) {
      catalogState.banner.featuredTrackId = '';
    }
    saveStateLocally();
    notifyListeners();

    // Purge from IndexedDB
    offlineCacheService.deleteTrack(id).catch(() => {});

    const firestoreInstance = getFirebaseFirestore();
    const rtdbInstance = getFirebaseRealtimeDb();
    const deleteTasks: Promise<any>[] = [];

    if (firestoreInstance) {
      deleteTasks.push(
        deleteDoc(doc(firestoreInstance.db, 'habajaba_songs', id)).catch((e) =>
          console.warn('Failed to delete track from Firestore:', e)
        )
      );
    }
    if (rtdbInstance) {
      deleteTasks.push(
        rtdbRemove(ref(rtdbInstance.rtdb, `habajaba_songs/${id}`)).catch((e) =>
          console.warn('Failed to delete track from Realtime Database:', e)
        )
      );
    }
    if (deleteTasks.length > 0) {
      Promise.allSettled(deleteTasks);
    }
  },

  async togglePublishTrack(id: string) {
    const track = catalogState.tracks.find((t) => t.id === id);
    if (!track) return;
    const updated = { ...track, published: !track.published };
    await this.updateTrack(updated);
  },

  getAlbums(): Album[] {
    const albumMap = new Map<string, Album>();
    catalogState.albums.forEach((a) => albumMap.set(a.title.toLowerCase(), a));

    catalogState.tracks
      .filter((t) => t.published && t.album && t.album.trim().length > 0)
      .forEach((t) => {
        const key = t.album.toLowerCase();
        if (!albumMap.has(key)) {
          albumMap.set(key, {
            id: `album-${key.replace(/\s+/g, '-')}`,
            title: t.album,
            artist: t.artist,
            coverUrl: t.coverUrl || '/banner-default.svg',
            releaseDate: t.releaseDate || new Date().toISOString().split('T')[0],
            genre: t.genre || 'Bengali Music',
            language: t.language || 'Bengali',
            description: `Official album released by Habajaba Studio LIVE.`,
            trackIds: [t.id],
          });
        } else {
          const existing = albumMap.get(key)!;
          if (!existing.trackIds.includes(t.id)) {
            existing.trackIds.push(t.id);
          }
        }
      });

    return Array.from(albumMap.values());
  },

  getAlbumById(id: string): Album | undefined {
    return this.getAlbums().find((a) => a.id === id);
  },

  getAlbumTracks(album: Album): Track[] {
    return this.getTracksByIds(album.trackIds);
  },

  getCuratedPlaylists(): Playlist[] {
    return catalogState.playlists;
  },

  getArtists(): Artist[] {
    const artistMap = new Map<string, Artist>();
    catalogState.artists.forEach((a) => {
      if (a && a.name && a.name.trim()) {
        artistMap.set(a.name.trim().toLowerCase(), a);
      }
    });

    catalogState.tracks
      .filter((t) => t.published && t.artist && t.artist.trim().length > 0)
      .forEach((t) => {
        const key = t.artist.trim().toLowerCase();
        if (!artistMap.has(key)) {
          artistMap.set(key, {
            id: `artist-${key.replace(/\s+/g, '-')}`,
            name: t.artist.trim(),
            avatarUrl: t.coverUrl || '/logo.svg',
            role: 'Bengali Artist',
            bio: `Artist recorded with Habajaba Studio LIVE.`,
          });
        }
      });

    return Array.from(artistMap.values()).map((artist) => {
      const aName = artist.name.trim().toLowerCase();
      const count = catalogState.tracks.filter(
        (t) =>
          t.published &&
          t.artist &&
          t.artist.trim().toLowerCase() === aName
      ).length;
      return {
        ...artist,
        trackCount: count,
      };
    });
  },

  getTracksByArtist(artistName: string): Track[] {
    const query = artistName.trim().toLowerCase();
    return catalogState.tracks.filter(
      (t) => t.published && t.artist.toLowerCase().includes(query)
    );
  },

  getAlbumsByArtist(artistName: string): Album[] {
    const query = artistName.trim().toLowerCase();
    return this.getAlbums().filter((a) => a.artist.toLowerCase().includes(query));
  },

  getGenres(): string[] {
    const set = new Set<string>();
    catalogState.tracks
      .filter((t) => t.published && t.genre)
      .forEach((t) => set.add(t.genre));
    return Array.from(set);
  },

  search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { tracks: [], albums: [], artists: [] };
    }

    const matchedTracks = catalogState.tracks.filter(
      (t) =>
        t.published &&
        (t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q) ||
          t.genre.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)))
    );

    const matchedAlbums = this.getAlbums().filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q) ||
        a.genre.toLowerCase().includes(q)
    );

    const matchedArtists = this.getArtists().filter(
      (a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    );

    return {
      tracks: matchedTracks,
      albums: matchedAlbums,
      artists: matchedArtists,
    };
  },

  exportCatalogJson(): string {
    return JSON.stringify(catalogState, null, 2);
  },

  async updateTrackCover(trackId: string, coverUrl: string) {
    const track = catalogState.tracks.find((t) => t.id === trackId);
    if (track) {
      await this.updateTrack({ ...track, coverUrl });
    }
  },

  resetCatalog() {
    catalogState = { ...defaultState, tracks: [], albums: [] };
    saveStateLocally();
  },

  /**
   * Completely clears all data, caches, and optionally remote database songs
   * Leaves the website 100% clean, fresh, and free from ghost or duplicate entries.
   */
  async clearAllData(includeCloud = true): Promise<{ success: boolean; message: string }> {
    // 1. Wipe in-memory catalog
    catalogState.tracks = [];
    catalogState.albums = [];

    // 2. Clear all local storage keys
    try {
      localStorage.removeItem(STORAGE_CATALOG_KEY);
      localStorage.removeItem(STORAGE_CATALOG_BACKUP_KEY);
      localStorage.removeItem(STORAGE_DELETED_TRACKS_KEY);
      localStorage.removeItem('habajaba_initial_seed_done');
      localStorage.removeItem('habajaba_cached_tracks');
    } catch {}

    // 3. Clear IndexedDB offline cache
    try {
      await offlineCacheService.clearAllCache();
    } catch {}

    saveStateLocally();
    notifyListeners();

    // 4. Optionally purge cloud documents if Firebase is connected
    if (includeCloud) {
      const firestoreInstance = getFirebaseFirestore();
      const rtdbInstance = getFirebaseRealtimeDb();

      if (firestoreInstance) {
        try {
          const songsCol = collection(firestoreInstance.db, 'habajaba_songs');
          const snap = await getDocs(songsCol);
          if (!snap.empty) {
            const batch = writeBatch(firestoreInstance.db);
            snap.forEach((d) => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (e) {
          console.warn('Firestore songs cleanup error:', e);
        }
      }

      if (rtdbInstance) {
        try {
          await rtdbRemove(ref(rtdbInstance.rtdb, 'habajaba_songs'));
        } catch (e) {
          console.warn('RTDB songs cleanup error:', e);
        }
      }
    }

    return {
      success: true,
      message: 'সমস্ত পুরনো ডেটা ও ক্যাশ সফলভাবে মুছে ওয়েবসাইট একদম নতুন ও ফ্রেশ করা হয়েছে।',
    };
  },

  // Sync all current local songs & banner into Firebase (Firestore and/or Realtime Database) in one click
  async syncAllLocalToFirestore(): Promise<{ success: boolean; count: number; error?: string }> {
    const firestoreInstance = getFirebaseFirestore();
    const rtdbInstance = getFirebaseRealtimeDb();

    if (!firestoreInstance && !rtdbInstance) {
      return {
        success: false,
        count: 0,
        error: 'Firebase is not connected. Please enter your Firebase configuration in Admin first.',
      };
    }

    let syncedCount = 0;
    let anySuccess = false;
    let lastError = '';

    // 1. Sync to Realtime Database if present
    if (rtdbInstance) {
      try {
        const songsRef = ref(rtdbInstance.rtdb, 'habajaba_songs');
        const songsObj: Record<string, Track> = {};
        catalogState.tracks.forEach((t) => {
          songsObj[t.id] = t;
        });
        await rtdbSet(songsRef, songsObj);

        const bannerRef = ref(rtdbInstance.rtdb, 'habajaba_settings/banner');
        await rtdbSet(bannerRef, catalogState.banner);

        if (catalogState.slidingBanners && catalogState.slidingBanners.length > 0) {
          const slidingRef = ref(rtdbInstance.rtdb, 'habajaba_settings/sliding_banners');
          await rtdbSet(slidingRef, { banners: catalogState.slidingBanners });
        }

        if (catalogState.branding) {
          const brandingRef = ref(rtdbInstance.rtdb, 'habajaba_settings/branding');
          await rtdbSet(brandingRef, catalogState.branding);
        }

        if (catalogState.artists && catalogState.artists.length > 0) {
          const artistsRef = ref(rtdbInstance.rtdb, 'habajaba_artists');
          const artistsObj: Record<string, Artist> = {};
          catalogState.artists.forEach((a) => {
            artistsObj[a.id] = a;
          });
          await rtdbSet(artistsRef, artistsObj);
        }
        anySuccess = true;
        syncedCount = catalogState.tracks.length;
      } catch (e: any) {
        lastError = e.message || 'Realtime Database sync failed';
      }
    }

    // 2. Sync to Firestore if present
    if (firestoreInstance) {
      try {
        const { db } = firestoreInstance;
        const batch = writeBatch(db);

        const bannerRef = doc(db, 'habajaba_settings', 'banner');
        batch.set(bannerRef, catalogState.banner);

        if (catalogState.slidingBanners && catalogState.slidingBanners.length > 0) {
          const slidingDoc = doc(db, 'habajaba_settings', 'sliding_banners');
          batch.set(slidingDoc, { banners: catalogState.slidingBanners });
        }

        if (catalogState.branding) {
          const brandingRef = doc(db, 'habajaba_settings', 'branding');
          batch.set(brandingRef, catalogState.branding);
        }

        for (const track of catalogState.tracks) {
          const trackRef = doc(db, 'habajaba_songs', track.id);
          batch.set(trackRef, track);
        }

        for (const artist of catalogState.artists) {
          const artistRef = doc(db, 'habajaba_artists', artist.id);
          batch.set(artistRef, artist);
        }

        await batch.commit();
        anySuccess = true;
        syncedCount = catalogState.tracks.length;
      } catch (err: any) {
        if (!anySuccess) lastError = err.message || 'Firestore batch write failed';
      }
    }

    if (anySuccess) {
      return { success: true, count: syncedCount };
    }
    return { success: false, count: 0, error: lastError };
  },
};
