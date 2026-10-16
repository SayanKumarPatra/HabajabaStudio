import rawMusicData from '../data/music.json';
import { Album, Artist, Playlist, Track } from '../types/music';

// Strongly typed catalog state
const tracksData: Track[] = (rawMusicData.tracks as Track[]).filter(t => t.published);
const albumsData: Album[] = rawMusicData.albums as Album[];
const playlistsData: Playlist[] = rawMusicData.playlists as Playlist[];
const artistsData: Artist[] = rawMusicData.artists as Artist[];

export const MusicService = {
  /**
   * Returns all published tracks, optionally sorted
   */
  getAllTracks(sortBy: 'newest' | 'title' | 'artist' = 'newest'): Track[] {
    const list = [...tracksData];
    if (sortBy === 'newest') {
      return list.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    }
    if (sortBy === 'title') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'artist') {
      return list.sort((a, b) => a.artist.localeCompare(b.artist));
    }
    return list;
  },

  /**
   * Returns featured tracks for hero and showcase
   */
  getFeaturedTracks(): Track[] {
    return tracksData.filter(t => t.featured);
  },

  /**
   * Latest releases (newest first)
   */
  getLatestReleases(limit = 6): Track[] {
    return [...tracksData]
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, limit);
  },

  /**
   * Get single track by ID
   */
  getTrackById(id: string): Track | undefined {
    return tracksData.find(t => t.id === id);
  },

  /**
   * Get multiple tracks by IDs preserving order
   */
  getTracksByIds(ids: string[]): Track[] {
    return ids
      .map(id => tracksData.find(t => t.id === id))
      .filter((t): t is Track => t !== undefined);
  },

  /**
   * Returns all albums
   */
  getAlbums(): Album[] {
    return albumsData;
  },

  /**
   * Get single album by ID
   */
  getAlbumById(id: string): Album | undefined {
    return albumsData.find(a => a.id === id);
  },

  /**
   * Get album tracks
   */
  getAlbumTracks(album: Album): Track[] {
    return this.getTracksByIds(album.trackIds);
  },

  /**
   * Returns all curated playlists
   */
  getCuratedPlaylists(): Playlist[] {
    return playlistsData;
  },

  /**
   * Get single playlist by ID
   */
  getPlaylistById(id: string): Playlist | undefined {
    return playlistsData.find(p => p.id === id);
  },

  /**
   * Returns all artists with dynamic track counts
   */
  getArtists(): Artist[] {
    return artistsData.map(artist => {
      const count = tracksData.filter(t => 
        t.artist.toLowerCase().includes(artist.name.toLowerCase()) || 
        artist.name.toLowerCase().includes(t.artist.toLowerCase())
      ).length;
      return {
        ...artist,
        trackCount: count,
      };
    });
  },

  /**
   * Get artist by ID
   */
  getArtistById(id: string): Artist | undefined {
    const list = this.getArtists();
    return list.find(a => a.id === id);
  },

  /**
   * Get all tracks belonging to an artist
   */
  getTracksByArtist(artistName: string): Track[] {
    const query = artistName.trim().toLowerCase();
    return tracksData.filter(t => t.artist.toLowerCase().includes(query));
  },

  /**
   * Get albums belonging to an artist
   */
  getAlbumsByArtist(artistName: string): Album[] {
    const query = artistName.trim().toLowerCase();
    return albumsData.filter(a => a.artist.toLowerCase().includes(query));
  },

  /**
   * Get distinct genres
   */
  getGenres(): string[] {
    const set = new Set<string>();
    tracksData.forEach(t => {
      if (t.genre) set.add(t.genre);
    });
    return Array.from(set);
  },

  /**
   * Search tracks, albums, and artists
   */
  search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { tracks: [], albums: [], artists: [] };
    }

    const matchedTracks = tracksData.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );

    const matchedAlbums = albumsData.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.artist.toLowerCase().includes(q) ||
      a.genre.toLowerCase().includes(q)
    );

    const matchedArtists = this.getArtists().filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    );

    return {
      tracks: matchedTracks,
      albums: matchedAlbums,
      artists: matchedArtists,
    };
  }
};
