import React, { useState, useEffect } from 'react';
import { AudioProvider, useAudio } from './context/AudioContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { Album, NavigationTab } from './types/music';
import { Shield } from 'lucide-react';
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
import { OfflineIndicator } from './components/OfflineIndicator';

function AppContent() {
  const { currentTrack } = useAudio();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isDropboxGuideOpen, setIsDropboxGuideOpen] = useState(false);

  // Navigation history stack for mobile back button ergonomics
  const navHistoryRef = React.useRef<NavigationTab[]>(['home']);
  const isNavigatingRef = React.useRef<boolean>(false);

  // Initialize browser history entry safely so hitting back button returns to previous screen instead of exiting app
  useEffect(() => {
    try {
      if (!window.history.state || !window.history.state.habajaba) {
        window.history.replaceState({ habajaba: true, tab: 'home' }, '', window.location.hash || '#home');
      }
    } catch {
      // Ignore iframe restrictions
    }

    const handlePopState = () => {
      try {
        // 1. If viewing an artist details page, back goes to artists list
        if (selectedArtistName) {
          setSelectedArtistName(null);
          return;
        }

        // 2. If viewing an album details page, back goes to home or previous tab
        if (selectedAlbum) {
          setSelectedAlbum(null);
          return;
        }

        // 3. If a modal is open, close it
        if (isDropboxGuideOpen) {
          setIsDropboxGuideOpen(false);
          return;
        }

        // 4. Return to previous tab if user navigated across tabs
        if (navHistoryRef.current.length > 1) {
          navHistoryRef.current.pop(); // Remove current tab
          const prevTab = navHistoryRef.current[navHistoryRef.current.length - 1] || 'home';
          isNavigatingRef.current = true;
          setCurrentTab(prevTab);
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 100);
        }
      } catch (err) {
        console.warn('Popstate handled safely:', err);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedArtistName, selectedAlbum, isDropboxGuideOpen]);

  // Sync hash routing for shareable URLs and page refresh
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.replace('#', '');

        if (!hash || hash === 'home') {
          setSelectedAlbum(null);
          setSelectedArtistName(null);
          setSelectedPlaylistId(null);
          setCurrentTab('home');
          return;
        }

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

        if (hash === 'artists') {
          setSelectedArtistName(null);
          setCurrentTab('artists');
          return;
        }

        if (['home', 'songs', 'artists', 'search', 'playlists', 'favorites', 'admin'].includes(hash)) {
          setSelectedAlbum(null);
          if (hash !== 'artists') setSelectedArtistName(null);
          if (hash !== 'playlists') setSelectedPlaylistId(null);
          setCurrentTab(hash as NavigationTab);
        }
      } catch (err) {
        console.warn('Hashchange handled safely:', err);
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
    // 1. Unconditionally update tab state first so the UI changes immediately
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

    // 2. Track internal history for mobile back navigation
    if (tab !== currentTab && !isNavigatingRef.current) {
      navHistoryRef.current.push(tab);
    }

    // 3. Safely sync browser history & hash without crashing in iframe
    try {
      window.history.pushState({ habajaba: true, tab }, '', `#${tab}`);
    } catch {
      try {
        window.location.hash = tab;
      } catch {}
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setCurrentTab('album-details');
    try {
      window.history.pushState({ habajaba: true, albumId: album.id }, '', `#${album.id}`);
    } catch {
      try {
        window.location.hash = album.id;
      } catch {}
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  const handleSelectArtist = (artistName: string | null) => {
    setSelectedArtistName(artistName);
    setCurrentTab('artists');
    try {
      if (artistName) {
        window.history.pushState({ habajaba: true, artist: artistName }, '', `#artist-${encodeURIComponent(artistName)}`);
      } else {
        window.history.pushState({ habajaba: true, tab: 'artists' }, '', '#artists');
      }
    } catch {
      try {
        window.location.hash = artistName ? `artist-${encodeURIComponent(artistName)}` : 'artists';
      } catch {}
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#FAFAF9] via-[#FFF8F8] to-[#FBF5F7] flex flex-col text-[#171717] overflow-x-hidden relative">
      {/* Subtle Floating Ambient Light Orbs (Non-white gentle motion) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-20 -left-20 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-red-500/10 rounded-full blur-[90px] animate-ambient-1" />
        <div className="absolute top-1/3 -right-20 w-72 sm:w-[460px] h-72 sm:h-[460px] bg-amber-400/10 rounded-full blur-[100px] animate-ambient-2" />
        <div className="absolute -bottom-20 left-1/4 w-80 sm:w-[480px] h-80 sm:h-[480px] bg-rose-400/10 rounded-full blur-[110px] animate-ambient-1" />
      </div>

      {/* Top Application Header */}
      <AppHeader
        currentTab={currentTab}
        onNavigate={handleNavigate}
      />

      {/* Network & Offline Cache Status Indicator */}
      <OfflineIndicator />

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

          <div className="pt-3 border-t border-neutral-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#6B7280]">
            <div className="flex items-center gap-1">
              <span
                onClick={() => handleNavigate('admin')}
                className="cursor-pointer select-none hover:text-[#ED1025] transition-colors p-1 -m-1 font-bold text-[#4B5563]"
                title=""
                aria-label="Copyright"
              >
                ©
              </span>
              <span>{new Date().getFullYear()} Habajaba Studio LIVE. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-2 text-[#9CA3AF]">
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
