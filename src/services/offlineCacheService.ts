import { Album, Artist, Track } from '../types/music';

const DB_NAME = 'HabajabaStudioOfflineDB';
const DB_VERSION = 1;

export interface CachedImageRecord {
  url: string;
  dataUrl: string;
  mimeType: string;
  timestamp: number;
  sizeBytes: number;
}

export interface OfflineCacheStats {
  albumCount: number;
  artistCount: number;
  trackCount: number;
  imageCount: number;
  lastUpdated: string | null;
}

class OfflineCacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isPrecacheInProgress = false;

  /**
   * Initializes or opens the IndexedDB database instance
   */
  public async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this browser/environment'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Store: Albums
        if (!db.objectStoreNames.contains('albums')) {
          db.createObjectStore('albums', { keyPath: 'id' });
        }

        // 2. Store: Artists
        if (!db.objectStoreNames.contains('artists')) {
          db.createObjectStore('artists', { keyPath: 'id' });
        }

        // 3. Store: Tracks
        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' });
        }

        // 4. Store: Images (Blob / DataURL Cache for offline rendering)
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }

        // 5. Store: App Metadata & Sync State
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Cache full album metadata into IndexedDB
   */
  public async saveAlbums(albums: Album[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['albums', 'metadata'], 'readwrite');
      const store = tx.objectStore('albums');

      for (const album of albums) {
        store.put(album);
      }

      const metaStore = tx.objectStore('metadata');
      metaStore.put({
        key: 'last_albums_sync',
        timestamp: Date.now(),
        count: albums.length,
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[OfflineDB] Error saving albums to IndexedDB:', e);
    }
  }

  /**
   * Retrieve cached albums from IndexedDB
   */
  public async getCachedAlbums(): Promise<Album[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('albums', 'readonly');
      const store = tx.objectStore('albums');
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as Album[]);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('[OfflineDB] Failed to read cached albums:', e);
      return [];
    }
  }

  /**
   * Cache artists metadata into IndexedDB
   */
  public async saveArtists(artists: Artist[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['artists', 'metadata'], 'readwrite');
      const store = tx.objectStore('artists');

      for (const artist of artists) {
        store.put(artist);
      }

      const metaStore = tx.objectStore('metadata');
      metaStore.put({
        key: 'last_artists_sync',
        timestamp: Date.now(),
        count: artists.length,
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[OfflineDB] Error saving artists to IndexedDB:', e);
    }
  }

  /**
   * Retrieve cached artists from IndexedDB
   */
  public async getCachedArtists(): Promise<Artist[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('artists', 'readonly');
      const store = tx.objectStore('artists');
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as Artist[]);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('[OfflineDB] Failed to read cached artists:', e);
      return [];
    }
  }

  /**
   * Cache tracks metadata into IndexedDB
   */
  public async saveTracks(tracks: Track[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['tracks', 'metadata'], 'readwrite');
      const store = tx.objectStore('tracks');

      for (const track of tracks) {
        store.put(track);
      }

      const metaStore = tx.objectStore('metadata');
      metaStore.put({
        key: 'last_tracks_sync',
        timestamp: Date.now(),
        count: tracks.length,
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[OfflineDB] Error saving tracks to IndexedDB:', e);
    }
  }

  /**
   * Retrieve cached tracks from IndexedDB
   */
  public async getCachedTracks(): Promise<Track[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('tracks', 'readonly');
      const store = tx.objectStore('tracks');
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as Track[]);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('[OfflineDB] Failed to read cached tracks:', e);
      return [];
    }
  }

  /**
   * Cache-First Image fetch and store:
   * 1. Checks if the image is already stored as base64 DataURL in IndexedDB.
   * 2. If present, returns the cached DataURL.
   * 3. If missing and online, downloads the image, converts to DataURL, and stores it in IndexedDB.
   */
  public async getOrCacheImage(url: string): Promise<string | null> {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return null;
    }

    try {
      const db = await this.getDB();

      // 1. Check if existing record exists in IndexedDB
      const existing = await new Promise<CachedImageRecord | undefined>((resolve) => {
        const tx = db.transaction('images', 'readonly');
        const store = tx.objectStore('images');
        const req = store.get(url);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      });

      if (existing && existing.dataUrl) {
        return existing.dataUrl;
      }

      // 2. If offline, we can only return what we found (or null)
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return null;
      }

      // 3. Download the image and store in IndexedDB
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      const dataUrl = await this.blobToDataUrl(blob);

      const record: CachedImageRecord = {
        url,
        dataUrl,
        mimeType: blob.type || 'image/jpeg',
        timestamp: Date.now(),
        sizeBytes: blob.size,
      };

      const writeTx = db.transaction('images', 'readwrite');
      writeTx.objectStore('images').put(record);

      return dataUrl;
    } catch (e) {
      // Failed to cache image (e.g. CORS or offline)
      return null;
    }
  }

  /**
   * Get cached image from IndexedDB synchronously/fast
   */
  public async getCachedImage(url: string): Promise<string | null> {
    if (!url) return null;
    try {
      const db = await this.getDB();
      return new Promise<string | null>((resolve) => {
        const tx = db.transaction('images', 'readonly');
        const store = tx.objectStore('images');
        const req = store.get(url);
        req.onsuccess = () => {
          const rec = req.result as CachedImageRecord | undefined;
          resolve(rec?.dataUrl || null);
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Helper: Convert Blob to Data URL
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Sync complete catalog metadata and pre-cache album covers & artist photos
   */
  public async syncCatalog(albums: Album[], artists: Artist[], tracks: Track[]): Promise<void> {
    await Promise.all([
      this.saveAlbums(albums),
      this.saveArtists(artists),
      this.saveTracks(tracks),
    ]);

    // Background pre-cache images without blocking execution
    this.precacheAllMedia(albums, artists, tracks).catch((e) => {
      console.warn('[OfflineDB] Background pre-cache warning:', e);
    });
  }

  /**
   * Background pre-caches all album covers and artist avatars so they remain viewable offline
   */
  public async precacheAllMedia(
    albums: Album[],
    artists: Artist[],
    tracks: Track[] = []
  ): Promise<{ success: number; failed: number }> {
    if (this.isPrecacheInProgress) {
      return { success: 0, failed: 0 };
    }
    this.isPrecacheInProgress = true;

    const urlsToCache = new Set<string>();

    // 1. Collect Artist avatars
    artists.forEach((artist) => {
      if (artist.avatarUrl && artist.avatarUrl.startsWith('http')) {
        urlsToCache.add(artist.avatarUrl);
      }
    });

    // 2. Collect Album covers
    albums.forEach((album) => {
      if (album.coverUrl && album.coverUrl.startsWith('http')) {
        urlsToCache.add(album.coverUrl);
      }
    });

    // 3. Collect Track covers
    tracks.forEach((track) => {
      if (track.coverUrl && track.coverUrl.startsWith('http')) {
        urlsToCache.add(track.coverUrl);
      }
    });

    let success = 0;
    let failed = 0;

    for (const url of Array.from(urlsToCache)) {
      try {
        const cached = await this.getOrCacheImage(url);
        if (cached) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    this.isPrecacheInProgress = false;
    return { success, failed };
  }

  /**
   * Inspect current offline storage counts
   */
  public async getStats(): Promise<OfflineCacheStats> {
    try {
      const db = await this.getDB();

      const getCount = (storeName: string): Promise<number> => {
        return new Promise((resolve) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(0);
        });
      };

      const [albumCount, artistCount, trackCount, imageCount] = await Promise.all([
        getCount('albums'),
        getCount('artists'),
        getCount('tracks'),
        getCount('images'),
      ]);

      const lastUpdated = await new Promise<string | null>((resolve) => {
        const tx = db.transaction('metadata', 'readonly');
        const store = tx.objectStore('metadata');
        const req = store.get('last_albums_sync');
        req.onsuccess = () => {
          const val = req.result;
          resolve(val?.timestamp ? new Date(val.timestamp).toLocaleTimeString() : null);
        };
        req.onerror = () => resolve(null);
      });

      return {
        albumCount,
        artistCount,
        trackCount,
        imageCount,
        lastUpdated,
      };
    } catch {
      return {
        albumCount: 0,
        artistCount: 0,
        trackCount: 0,
        imageCount: 0,
        lastUpdated: null,
      };
    }
  }

  /**
   * Register the Service Worker in supported browsers
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[SW] Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.warn('[SW] Service Worker registration failed:', error);
      return null;
    }
  }
}

export const offlineCacheService = new OfflineCacheService();
