import React, { useState, useEffect } from 'react';
import { AudioProvider, useAudio } from './context/AudioContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { Album, NavigationTab } from './types/music';
import { MusicService } from './services/musicService';
import { AppHeader } from './components/AppHeader';
import { BottomNavigation } from './components/BottomNavigation';
import { MiniPlayer } from './components/MiniPlayer';
import { ExpandedPlayer } from './components/ExpandedPlayer';
import { DropboxGuideModal } from './components/DropboxGuideModal';

import { HomePage } from './pages/HomePage';
import { AllSongsPage } from './pages/AllSongsPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { SearchPage } from './pages/SearchPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { AlbumDetailsPage } from './pages/AlbumDetailsPage';

function AppContent() {
  const { currentTrack } = useAudio();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isDropboxGuideOpen, setIsDropboxGuideOpen] = useState(false);

  // Sync hash routing for shareable URLs and page refresh
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('album-')) {
        const albumId = hash;
        const found = MusicService.getAlbumById(albumId);
        if (found) {
          setSelectedAlbum(found);
          setCurrentTab('album-details');
          return;
        }
      }
      if (hash.startsWith('artist-')) {
        const artistName = decodeURIComponent(hash.replace('artist-', ''));
        setSelectedArtistName(artistName);
        setCurrentTab('artists');
        return;
      }
      if (['home', 'songs', 'artists', 'search', 'playlists', 'favorites'].includes(hash)) {
        setCurrentTab(hash as NavigationTab);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (tab !== 'album-details') {
      setSelectedAlbum(null);
    }
    if (tab !== 'artists') {
      setSelectedArtistName(null);
    }
    if (tab !== 'playlists') {
      setSelectedPlaylistId(null);
    }
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setCurrentTab('album-details');
    window.location.hash = album.id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArtist = (artistName: string | null) => {
    setSelectedArtistName(artistName);
    setCurrentTab('artists');
    if (artistName) {
      window.location.hash = `artist-${encodeURIComponent(artistName)}`;
    } else {
      window.location.hash = 'artists';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlaylist = (playlistId: string | null) => {
    setSelectedPlaylistId(playlistId);
    setCurrentTab('playlists');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine bottom padding so content is never obscured by MiniPlayer + BottomNavigation
  // Mobile: BottomNav is 64px (h-16). If MiniPlayer active, + 68px = 132px + safe-area.
  // Desktop: MiniPlayer is docked at bottom (72px) when active.
  const contentBottomPadding = currentTrack
    ? 'pb-36 md:pb-24'
    : 'pb-24 md:pb-12';

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#171717]">
      {/* Top Application Header */}
      <AppHeader
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenDropboxGuide={() => setIsDropboxGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 ${contentBottomPadding}`}>
        {currentTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectAlbum={handleSelectAlbum}
            onSelectArtist={handleSelectArtist}
          />
        )}

        {currentTab === 'songs' && (
          <AllSongsPage
            onSelectAlbum={handleSelectAlbum}
            onSelectArtist={handleSelectArtist}
          />
        )}

        {currentTab === 'artists' && (
          <ArtistsPage
            selectedArtistName={selectedArtistName}
            onSelectArtist={handleSelectArtist}
            onSelectAlbum={handleSelectAlbum}
          />
        )}

        {currentTab === 'search' && (
          <SearchPage
            onSelectAlbum={handleSelectAlbum}
            onSelectArtist={handleSelectArtist}
          />
        )}

        {currentTab === 'playlists' && (
          <PlaylistsPage
            selectedPlaylistId={selectedPlaylistId}
            onSelectPlaylist={handleSelectPlaylist}
            onSelectAlbum={handleSelectAlbum}
            onSelectArtist={handleSelectArtist}
          />
        )}

        {currentTab === 'favorites' && (
          <FavoritesPage
            onNavigate={handleNavigate}
            onSelectAlbum={handleSelectAlbum}
            onSelectArtist={handleSelectArtist}
          />
        )}

        {currentTab === 'album-details' && selectedAlbum && (
          <AlbumDetailsPage
            album={selectedAlbum}
            onBack={() => handleNavigate('home')}
            onSelectArtist={handleSelectArtist}
            onSelectAlbum={handleSelectAlbum}
          />
        )}
      </main>

      {/* Desktop Clean Footer */}
      <footer className="border-t border-[#EAEAEA] bg-neutral-50/70 py-8 px-4 text-center text-xs text-[#6B7280]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-bold text-[#171717]">Habajaba Studio LIVE</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span className="font-bengali">অরিজিনাল বাংলা মিউজিক স্টুডিও</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsDropboxGuideOpen(true)}
              className="text-[#6B7280] hover:text-[#ED1025] transition-colors"
            >
              Dropbox Setup & Link Tester
            </button>
            <span aria-hidden="true">·</span>
            <span>Local Device Storage</span>
            <span aria-hidden="true">·</span>
            <span>© {new Date().getFullYear()} Habajaba Studio LIVE</span>
          </div>
        </div>
      </footer>

      {/* Persistent Mini Player */}
      <MiniPlayer />

      {/* Fixed Bottom Navigation (Mobile Only) */}
      <BottomNavigation
        currentTab={currentTab}
        onNavigate={handleNavigate}
      />

      {/* Expanded Player Fullscreen Drawer */}
      <ExpandedPlayer />

      {/* Dropbox Audio Guide & Validator Modal */}
      <DropboxGuideModal
        isOpen={isDropboxGuideOpen}
        onClose={() => setIsDropboxGuideOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <FavoritesProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </FavoritesProvider>
  );
}
