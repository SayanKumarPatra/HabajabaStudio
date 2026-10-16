import rawMusicData from '../data/music.json';
import { Album, Artist, HeroBannerConfig, Playlist, Track } from '../types/music';

const STORAGE_CATALOG_KEY = 'habajaba_admin_catalog_v2';

interface CatalogState {
  banner: HeroBannerConfig;
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
  tracks: (rawMusicData.tracks as Track[]) || [],
  albums: (rawMusicData.albums as Album[]) || [],
  playlists: (rawMusicData.playlists as Playlist[]) || [],
  artists: (rawMusicData.artists as Artist[]) || [],
};

function loadState(): CatalogState {
  try {
    const saved = localStorage.getItem(STORAGE_CATALOG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        banner: parsed.banner || defaultState.banner,
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

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(catalogState));
  } catch (e) {
    console.warn('Failed to save catalog to localStorage:', e);
  }
  notifyListeners();
}

export const MusicService = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  getHeroBanner(): HeroBannerConfig {
    return catalogState.banner;
  },

  saveHeroBanner(banner: HeroBannerConfig) {
    catalogState.banner = banner;
    saveState();
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

  addTrack(track: Track) {
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
    saveState();
  },

  updateTrack(updated: Track) {
    catalogState.tracks = catalogState.tracks.map((t) => (t.id === updated.id ? updated : t));
    saveState();
  },

  deleteTrack(id: string) {
    catalogState.tracks = catalogState.tracks.filter((t) => t.id !== id);
    // Also remove from banner if it was featured
    if (catalogState.banner.featuredTrackId === id) {
      catalogState.banner.featuredTrackId = '';
    }
    saveState();
  },

  togglePublishTrack(id: string) {
    catalogState.tracks = catalogState.tracks.map((t) =>
      t.id === id ? { ...t, published: !t.published } : t
    );
    saveState();
  },

  getAlbums(): Album[] {
    // Generate dynamic albums based on tracks with album names
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

  resetCatalog() {
    catalogState = { ...defaultState };
    saveState();
  },
};
