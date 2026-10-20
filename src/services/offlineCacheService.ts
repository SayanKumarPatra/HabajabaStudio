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
  private syncDebounceTimer: any = null;

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
   * Cache full album metadata into IndexedDB (clears old obsolete records)
   */
  public async saveAlbums(albums: Album[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['albums', 'metadata'], 'readwrite');
      const store = tx.objectStore('albums');

      // Clear obsolete albums so deleted ones are permanently purged
      store.clear();

      for (const album of albums) {
        if (album && album.id) {
          store.put(album);
        }
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
   * Cache artists metadata into IndexedDB (clears old obsolete records)
   */
  public async saveArtists(artists: Artist[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['artists', 'metadata'], 'readwrite');
      const store = tx.objectStore('artists');

      // Clear obsolete artists so deleted ones are permanently purged
      store.clear();

      for (const artist of artists) {
        if (artist && artist.id) {
          store.put(artist);
        }
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

  public async saveArtist(artist: Artist): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['artists'], 'readwrite');
      const store = tx.objectStore('artists');
      if (artist && artist.id) {
        store.put(artist);
      }
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[OfflineDB] Error saving single artist:', e);
    }
  }

  /**
   * Explicitly delete an artist from IndexedDB
   */
  public async deleteArtist(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('artists', 'readwrite');
      tx.objectStore('artists').delete(id);
    } catch (e) {
      console.warn('[OfflineDB] Failed to delete artist from cache:', e);
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
   * Cache tracks metadata into IndexedDB (clears old obsolete records)
   */
  public async saveTracks(tracks: Track[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['tracks', 'metadata'], 'readwrite');
      const store = tx.objectStore('tracks');

      // Clear obsolete tracks so deleted tracks are permanently removed
      store.clear();

      for (const track of tracks) {
        if (track && track.id) {
          store.put(track);
        }
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
   * Explicitly delete a track from IndexedDB
   */
  public async deleteTrack(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('tracks', 'readwrite');
      tx.objectStore('tracks').delete(id);
    } catch (e) {
      console.warn('[OfflineDB] Failed to delete track from cache:', e);
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
   * Cache-First Image fetch and store
   */
  public async getOrCacheImage(url: string): Promise<string | null> {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('data:')) return url; // Already inline

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

      // 2. If offline, return null
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
   * Sync complete catalog metadata without blocking UI (debounced)
   */
  public async syncCatalog(albums: Album[], artists: Artist[], tracks: Track[]): Promise<void> {
    // Save metadata fast to IndexedDB
    try {
      await Promise.all([
        this.saveAlbums(albums),
        this.saveArtists(artists),
        this.saveTracks(tracks),
      ]);
    } catch (e) {
      console.warn('[OfflineDB] Fast catalog sync notice:', e);
    }

    // Debounce image pre-caching so it never burdens saving or UI
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    this.syncDebounceTimer = setTimeout(() => {
      this.precacheAllMedia(albums, artists, tracks).catch(() => {});
    }, 4000);
  }

  /**
   * Background pre-caches all album covers and artist avatars in idle time
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

    try {
      const urlsToCache = new Set<string>();

      artists.forEach((artist) => {
        if (artist.avatarUrl && artist.avatarUrl.startsWith('http') && !artist.avatarUrl.startsWith('data:')) {
          urlsToCache.add(artist.avatarUrl);
        }
      });

      albums.forEach((album) => {
        if (album.coverUrl && album.coverUrl.startsWith('http') && !album.coverUrl.startsWith('data:')) {
          urlsToCache.add(album.coverUrl);
        }
      });

      tracks.forEach((track) => {
        if (track.coverUrl && track.coverUrl.startsWith('http') && !track.coverUrl.startsWith('data:')) {
          urlsToCache.add(track.coverUrl);
        }
      });

      let success = 0;
      let failed = 0;

      // Process in small batches of 2 with delays to prevent CPU/network hogging
      const urlList = Array.from(urlsToCache);
      for (const url of urlList) {
        try {
          const res = await this.getOrCacheImage(url);
          if (res) success++;
          else failed++;
        } catch {
          failed++;
        }
        // Small pause
        await new Promise((r) => setTimeout(r, 60));
      }

      return { success, failed };
    } finally {
      this.isPrecacheInProgress = false;
    }
  }

  /**
   * Get storage statistics (alias for backward compatibility)
   */
  public async getStats(): Promise<OfflineCacheStats> {
    return this.getCacheStats();
  }

  /**
   * Get storage statistics
   */
  public async getCacheStats(): Promise<OfflineCacheStats> {
    try {
      const db = await this.getDB();

      const [albumCount, artistCount, trackCount, imageCount, meta] = await Promise.all([
        this.countStore(db, 'albums'),
        this.countStore(db, 'artists'),
        this.countStore(db, 'tracks'),
        this.countStore(db, 'images'),
        this.getMeta(db, 'last_tracks_sync'),
      ]);

      const lastUpdated = meta?.timestamp
        ? new Date(meta.timestamp).toLocaleTimeString()
        : null;

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

  private countStore(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }

  private getMeta(db: IDBDatabase, key: string): Promise<any> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('metadata', 'readonly');
        const req = tx.objectStore('metadata').get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Clear all cached data
   */
  public async clearAllCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const stores = ['albums', 'artists', 'tracks', 'images', 'metadata'];
      const tx = db.transaction(stores, 'readwrite');
      stores.forEach((s) => tx.objectStore(s).clear());
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  }

  /**
   * Register service worker
   */
  public async registerServiceWorker(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }
    try {
      await navigator.serviceWorker.register('/sw.js');
      return true;
    } catch {
      return false;
    }
  }
}

export const offlineCacheService = new OfflineCacheService();
