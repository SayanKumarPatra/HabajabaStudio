export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: string;
  language: string;
  releaseDate: string;
  genre: string;
  featured: boolean;
  published: boolean;
  description?: string;
  lyrics?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  releaseDate: string;
  genre: string;
  language: string;
  description?: string;
  trackIds: string[];
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  bio: string;
  trackCount?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  isUserCreated?: boolean;
  createdAt?: string;
}

export type NavigationTab = 'home' | 'songs' | 'artists' | 'search' | 'playlists' | 'favorites' | 'album-details' | 'artist-details' | 'playlist-details';
