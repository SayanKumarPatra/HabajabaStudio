export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string; // 16:9 YouTube format banner or cover image
  audioUrl: string; // Dropbox direct link or YouTube URL or direct audio stream
  duration: string;
  language: string;
  releaseDate: string;
  genre: string;
  featured: boolean;
  published: boolean;
  description?: string;
  lyrics?: string;
  youtubeId?: string;
  sourceType?: 'dropbox' | 'youtube' | 'direct';
}

export interface BannerSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
}

export interface HeroBannerConfig {
  title: string;
  subtitle: string;
  bannerUrl: string; // 16:9 banner image
  featuredTrackId?: string;
}

export interface BrandingConfig {
  logoUrl?: string;
  studioName?: string;
  tagline?: string;
  youtubeChannelUrl?: string;
  youtubeChannelName?: string;
  youtubeSubscriberText?: string;
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
  youtubeUrl?: string;
  coverPhotoUrl?: string;
  socialUrl?: string;
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

export type NavigationTab =
  | 'home'
  | 'songs'
  | 'artists'
  | 'search'
  | 'playlists'
  | 'favorites'
  | 'album-details'
  | 'artist-details'
  | 'playlist-details'
  | 'admin';
