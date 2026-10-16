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
import { AdminPage } from './pages/AdminPage';

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
      if (['home', 'songs', 'artists', 'search', 'playlists', 'favorites', 'admin'].includes(hash)) {
        setCurrentTab(hash as NavigationTab);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    // Discreet shortcut to jump into Admin (Ctrl+Shift+A or Cmd+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleNavigate('admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
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

  // Determine bottom padding so content is never obscured by MiniPlayer + BottomNavigation, respecting safe areas
  const contentBottomPadding = currentTrack
    ? 'pb-[calc(8rem+env(safe-area-inset-bottom,0px))] md:pb-20'
    : 'pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-8';

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col text-[#171717] overflow-x-hidden">
      {/* Top Application Header */}
      <AppHeader
        currentTab={currentTab}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-2.5 sm:pt-5 ${contentBottomPadding}`}>
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

        {currentTab === 'admin' && (
          <AdminPage onOpenDropboxGuide={() => setIsDropboxGuideOpen(true)} />
        )}
      </main>

      {/* Rich Footer with Descriptions, Copyright & Discreet Admin Access */}
      <footer className="border-t border-[#EAEAEA] bg-neutral-50/90 py-6 px-4 text-xs text-[#6B7280]">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#ED1025] tracking-tight">HabaJaba Studio LIVE</span>
                <span className="text-[#9CA3AF]">·</span>
                <span className="font-bold text-[#171717] font-bengali">অরিজিনাল বাংলা মিউজিক প্ল্যাটফর্ম</span>
              </div>
              <p className="text-[11px] text-[#6B7280] max-w-xl font-bengali leading-relaxed">
                লাইভ অ্যাকোস্টিক সেশন, স্টুডিও মাস্টার্স ও অরিজিনাল বাংলা গানের ডিজিটাল হোম। সকল অডিও ড্রপবক্স ডিরেক্ট স্ট্রিমিং এবং ফায়ারবেস রিয়েল-টাইম ক্লাউড সিঙ্ক দ্বারা পরিচালিত।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
              <button
                onClick={() => handleNavigate('songs')}
                className="hover:text-[#ED1025] transition-colors"
              >
                All Songs
              </button>
              <span className="text-neutral-300">·</span>
              <button
                onClick={() => handleNavigate('artists')}
                className="hover:text-[#ED1025] transition-colors"
              >
                Artists
              </button>
              <span className="text-neutral-300">·</span>
              <button
                onClick={() => handleNavigate('playlists')}
                className="hover:text-[#ED1025] transition-colors"
              >
                Playlists
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#9CA3AF]">
            <div className="flex items-center gap-1 font-bengali">
              <span
                onClick={() => handleNavigate('admin')}
                className="cursor-default select-none"
                title=""
              >
                ©
              </span>
              <span>{new Date().getFullYear()} Habajaba Studio LIVE. সর্বস্বত্ব সংরক্ষিত (All rights reserved).</span>
            </div>

            <div className="flex items-center gap-2">
              <span>Digital Acoustic Master</span>
              <span className="text-neutral-300">·</span>
              <span>High-Fidelity Bengali Audio</span>
            </div>
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
