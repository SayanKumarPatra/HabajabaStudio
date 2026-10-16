import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { ref, onValue, set as rtdbSet, remove as rtdbRemove } from 'firebase/database';
import rawMusicData from '../data/music.json';
import { Album, Artist, BannerSlide, BrandingConfig, HeroBannerConfig, Playlist, Track } from '../types/music';
import { getFirebaseFirestore, getFirebaseRealtimeDb, getActiveFirebaseConfig } from './firebaseConfig';
import { offlineCacheService } from './offlineCacheService';

const STORAGE_CATALOG_KEY = 'habajaba_admin_catalog_v2';
const STORAGE_BRANDING_KEY = 'habajaba_admin_branding_v1';
const STORAGE_SLIDING_BANNERS_KEY = 'habajaba_sliding_banners_v1';

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
  tracks: (rawMusicData.tracks as Track[]) || [],
  albums: (rawMusicData.albums as Album[]) || [],
  playlists: (rawMusicData.playlists as Playlist[]) || [],
  artists: (rawMusicData.artists as Artist[]) || [],
};

function loadState(): CatalogState {
  try {
    const saved = localStorage.getItem(STORAGE_CATALOG_KEY);
    const savedBranding = localStorage.getItem(STORAGE_BRANDING_KEY);
    const savedSlidingBanners = localStorage.getItem(STORAGE_SLIDING_BANNERS_KEY);
    const branding = savedBranding ? JSON.parse(savedBranding) : defaultState.branding;
    const slidingBanners = savedSlidingBanners ? JSON.parse(savedSlidingBanners) : defaultState.slidingBanners;

    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        banner: parsed.banner || defaultState.banner,
        slidingBanners: Array.isArray(parsed.slidingBanners) && parsed.slidingBanners.length > 0 ? parsed.slidingBanners : slidingBanners,
        branding: parsed.branding || branding,
        tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
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

  // If offline or localStorage is empty, restore from IndexedDB
  if (catalogState.tracks.length === 0 || !navigator.onLine) {
    offlineCacheService.getCachedTracks().then((cachedTracks) => {
      if (cachedTracks && cachedTracks.length > 0 && catalogState.tracks.length === 0) {
        catalogState.tracks = cachedTracks;
        notifyListeners();
      }
    }).catch(() => {});
  }

  // Pre-cache catalog into IndexedDB on initial launch
  setTimeout(() => {
    offlineCacheService.syncCatalog(
      MusicService.getAlbums(),
      MusicService.getArtists(),
      catalogState.tracks
    ).catch(() => {});
  }, 1200);
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
          // Update tracks in state with live Firestore data
          catalogState.tracks = remoteTracks;
          saveStateLocally();
        } else if (catalogState.tracks.length > 0) {
          MusicService.syncAllLocalToFirestore();
        }
      },
      (error) => {
        console.warn('Firestore tracks listener error (falling back to local cache):', error);
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
          catalogState.artists = remoteArtists;
          saveStateLocally();
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
        const remoteTracks: Track[] = Object.keys(val).map((k) => ({
          ...val[k],
          id: k,
        }));
        if (remoteTracks.length > 0) {
          catalogState.tracks = remoteTracks;
          saveStateLocally();
        }
      } else if (catalogState.tracks.length > 0) {
        const songsObj: Record<string, Track> = {};
        catalogState.tracks.forEach((t) => {
          songsObj[t.id] = t;
        });
        rtdbSet(songsRef, songsObj).catch(() => {});
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
    onValue(slidingRef, (snapshot) => {
      const val = snapshot.val();
      if (val && Array.isArray(val.banners) && val.banners.length > 0) {
        catalogState.slidingBanners = val.banners;
        saveStateLocally();
      }
    });

    // 5. Real-time listener for Artists in RTDB
    const artistsRef = ref(rtdb, 'habajaba_artists');
    onValue(artistsRef, (snapshot) => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        const remoteArtists: Artist[] = Object.keys(val).map((k) => ({
          ...val[k],
          id: k,
        }));
        if (remoteArtists.length > 0) {
          catalogState.artists = remoteArtists;
          saveStateLocally();
        }
      }
    });

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

  async saveArtist(artist: Artist) {
    const existingIndex = catalogState.artists.findIndex(
      (a) => a.id === artist.id || a.name.toLowerCase() === artist.name.toLowerCase()
    );
    if (existingIndex >= 0) {
      const oldArtist = catalogState.artists[existingIndex];
      catalogState.artists[existingIndex] = { ...oldArtist, ...artist };
      if (oldArtist.name !== artist.name) {
        catalogState.tracks = catalogState.tracks.map((t) =>
          t.artist.toLowerCase() === oldArtist.name.toLowerCase()
            ? { ...t, artist: artist.name }
            : t
        );
      }
    } else {
      catalogState.artists.push(artist);
    }
    saveStateLocally();

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await setDoc(doc(firestoreInstance.db, 'habajaba_artists', artist.id || `artist-${Date.now()}`), artist);
      } catch (e) {
        console.warn('Failed to sync artist to Firestore:', e);
      }
    }

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const artistRef = ref(rtdbInstance.rtdb, `habajaba_artists/${artist.id || Date.now()}`);
        await rtdbSet(artistRef, artist);
      } catch (e) {
        console.warn('Failed to sync artist to RTDB:', e);
      }
    }
  },

  async deleteArtist(id: string) {
    catalogState.artists = catalogState.artists.filter((a) => a.id !== id);
    saveStateLocally();

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await deleteDoc(doc(firestoreInstance.db, 'habajaba_artists', id));
      } catch (e) {
        console.warn('Failed to delete artist from Firestore:', e);
      }
    }

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const artistRef = ref(rtdbInstance.rtdb, `habajaba_artists/${id}`);
        await rtdbRemove(artistRef);
      } catch (e) {
        console.warn('Failed to delete artist from RTDB:', e);
      }
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
    catalogState.tracks = [track, ...catalogState.tracks];
    // If track has an artist not in the artists list, add artist
    if (track.artist && !catalogState.artists.some((a) => a.name.toLowerCase() === track.artist.toLowerCase())) {
      catalogState.artists.push({
        id: `artist-${Date.now()}`,
        name: track.artist,
        avatarUrl: track.coverUrl || '/logo.svg',
        role: 'Bengali Artist',
        bio: `Artist recorded with Habajaba Studio LIVE.`,
      });
    }
    saveStateLocally();

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await setDoc(doc(firestoreInstance.db, 'habajaba_songs', track.id), track);
      } catch (e) {
        console.warn('Failed to write track to Firestore:', e);
      }
    }

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const trackRef = ref(rtdbInstance.rtdb, `habajaba_songs/${track.id}`);
        await rtdbSet(trackRef, track);
      } catch (e) {
        console.warn('Failed to write track to Realtime Database:', e);
      }
    }
  },

  async updateTrack(updated: Track) {
    catalogState.tracks = catalogState.tracks.map((t) => (t.id === updated.id ? updated : t));
    saveStateLocally();

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await setDoc(doc(firestoreInstance.db, 'habajaba_songs', updated.id), updated);
      } catch (e) {
        console.warn('Failed to update track in Firestore:', e);
      }
    }

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const trackRef = ref(rtdbInstance.rtdb, `habajaba_songs/${updated.id}`);
        await rtdbSet(trackRef, updated);
      } catch (e) {
        console.warn('Failed to update track in Realtime Database:', e);
      }
    }
  },

  async deleteTrack(id: string) {
    catalogState.tracks = catalogState.tracks.filter((t) => t.id !== id);
    if (catalogState.banner.featuredTrackId === id) {
      catalogState.banner.featuredTrackId = '';
    }
    saveStateLocally();

    const firestoreInstance = getFirebaseFirestore();
    if (firestoreInstance) {
      try {
        await deleteDoc(doc(firestoreInstance.db, 'habajaba_songs', id));
      } catch (e) {
        console.warn('Failed to delete track from Firestore:', e);
      }
    }

    const rtdbInstance = getFirebaseRealtimeDb();
    if (rtdbInstance) {
      try {
        const trackRef = ref(rtdbInstance.rtdb, `habajaba_songs/${id}`);
        await rtdbRemove(trackRef);
      } catch (e) {
        console.warn('Failed to delete track from Realtime Database:', e);
      }
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
    catalogState.artists.forEach((a) => artistMap.set(a.name.toLowerCase(), a));

    catalogState.tracks
      .filter((t) => t.published && t.artist && t.artist.trim().length > 0)
      .forEach((t) => {
        const key = t.artist.toLowerCase();
        if (!artistMap.has(key)) {
          artistMap.set(key, {
            id: `artist-${key.replace(/\s+/g, '-')}`,
            name: t.artist,
            avatarUrl: t.coverUrl || '/logo.svg',
            role: 'Bengali Artist',
            bio: `Artist recorded with Habajaba Studio LIVE.`,
          });
        }
      });

    return Array.from(artistMap.values()).map((artist) => {
      const count = catalogState.tracks.filter(
        (t) =>
          t.published &&
          (t.artist.toLowerCase().includes(artist.name.toLowerCase()) ||
            artist.name.toLowerCase().includes(t.artist.toLowerCase()))
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
    catalogState = { ...defaultState };
    saveStateLocally();
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

        if (catalogState.branding) {
          const brandingRef = ref(rtdbInstance.rtdb, 'habajaba_settings/branding');
          await rtdbSet(brandingRef, catalogState.branding);
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

        if (catalogState.branding) {
          const brandingRef = doc(db, 'habajaba_settings', 'branding');
          batch.set(brandingRef, catalogState.branding);
        }

        for (const track of catalogState.tracks) {
          const trackRef = doc(db, 'habajaba_songs', track.id);
          batch.set(trackRef, track);
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
