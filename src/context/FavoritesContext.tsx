import React, { createContext, useContext, useEffect, useState } from 'react';
import { Playlist } from '../types/music';

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (trackId: string) => void;
  removeFavorite: (trackId: string) => void;
  clearFavorites: () => void;
  userPlaylists: Playlist[];
  createUserPlaylist: (title: string, description?: string) => Playlist;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deleteUserPlaylist: (playlistId: string) => void;
  recentlyPlayed: string[];
  addRecentlyPlayed: (trackId: string) => void;
}

const FAVORITES_STORAGE_KEY = 'habajaba_favorites_v1';
const PLAYLISTS_STORAGE_KEY = 'habajaba_playlists_v1';
const RECENTS_STORAGE_KEY = 'habajaba_recents_v1';

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Could not read favorites from localStorage:', e);
      return [];
    }
  });

  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(() => {
    try {
      const stored = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Could not read user playlists from localStorage:', e);
      return [];
    }
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Could not read recents from localStorage:', e);
      return [];
    }
  });

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Could not save favorites to localStorage:', e);
    }
  }, [favorites]);

  // Persist user playlists
  useEffect(() => {
    try {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(userPlaylists));
    } catch (e) {
      console.warn('Could not save user playlists to localStorage:', e);
    }
  }, [userPlaylists]);

  // Persist recently played
  useEffect(() => {
    try {
      localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(recentlyPlayed));
    } catch (e) {
      console.warn('Could not save recents to localStorage:', e);
    }
  }, [recentlyPlayed]);

  const isFavorite = (trackId: string): boolean => {
    return favorites.includes(trackId);
  };

  const toggleFavorite = (trackId: string) => {
    setFavorites(prev => {
      if (prev.includes(trackId)) {
        return prev.filter(id => id !== trackId);
      } else {
        return [trackId, ...prev];
      }
    });
  };

  const removeFavorite = (trackId: string) => {
    setFavorites(prev => prev.filter(id => id !== trackId));
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const createUserPlaylist = (title: string, description = ''): Playlist => {
    const newPlaylist: Playlist = {
      id: `user-pl-${Date.now()}`,
      title: title.trim() || 'My Playlist',
      description: description.trim() || 'Custom playlist created on this device.',
      coverUrl: '',
      trackIds: [],
      isUserCreated: true,
      createdAt: new Date().toISOString(),
    };
    setUserPlaylists(prev => [newPlaylist, ...prev]);
    return newPlaylist;
  };

  const addTrackToPlaylist = (playlistId: string, trackId: string) => {
    setUserPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.trackIds.includes(trackId)) return p;
        return { ...p, trackIds: [...p.trackIds, trackId] };
      }
      return p;
    }));
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setUserPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, trackIds: p.trackIds.filter(id => id !== trackId) };
      }
      return p;
    }));
  };

  const deleteUserPlaylist = (playlistId: string) => {
    setUserPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  const addRecentlyPlayed = (trackId: string) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(id => id !== trackId);
      return [trackId, ...filtered].slice(0, 30);
    });
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clearFavorites,
        userPlaylists,
        createUserPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        deleteUserPlaylist,
        recentlyPlayed,
        addRecentlyPlayed,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
