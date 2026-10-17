import React, { useState } from 'react';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Copy,
  Music,
  FileJson,
  X,
  Upload,
  Eye,
  EyeOff,
  Cloud,
  Palette,
  Sliders,
  Users,
  Database,
  Lock,
  KeyRound,
  LogOut,
  Youtube,
  Radio,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { HeroBannerConfig, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { analyzeAudioUrl, testAudioStreamability } from '../utils/dropbox';
import { extractYouTubeVideoId, fetchYouTubeMetadata, getYouTubeThumbnail, isYouTubeUrl } from '../utils/youtube';
import { useAudio } from '../context/AudioContext';
import { CoverImage } from '../components/CoverImage';
import { BrandingAdminSection } from '../components/BrandingAdminSection';
import { FirebaseAdminSection } from '../components/FirebaseAdminSection';
import { SlidingBannersAdminSection } from '../components/SlidingBannersAdminSection';
import { ArtistsAdminSection } from '../components/ArtistsAdminSection';
import { OfflineAdminSection } from '../components/OfflineAdminSection';
import { uploadImageToCloud } from '../services/cloudStorageService';

export interface AdminPageProps {
  onOpenDropboxGuide?: () => void;
}

const ADMIN_SECRET_PIN = '152006';
const ADMIN_SESSION_KEY = 'habajaba_admin_authorized';

export const AdminPage: React.FC<AdminPageProps> = ({ onOpenDropboxGuide }) => {
  const { playTrack, isPlaying, currentTrack, togglePlay } = useAudio();

  // Security Lock State (PIN 152006)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === ADMIN_SECRET_PIN;
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Tab state
  const [adminTab, setAdminTab] = useState<'banners' | 'songs' | 'artists' | 'branding' | 'firebase' | 'offline'>('banners');

  const [tracks, setTracks] = useState<Track[]>(() =>
    MusicService.getAllTracks('newest', true)
  );
  const [banner, setBanner] = useState<HeroBannerConfig>(() =>
    MusicService.getHeroBanner()
  );

  // Form state for creating / editing track
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [audioSourceType, setAudioSourceType] = useState<'youtube' | 'dropbox'>('youtube');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Habajaba Studio LIVE');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Acoustic Live');
  const [coverUrl, setCoverUrl] = useState('/banner-default.svg');
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [duration, setDuration] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);

  // Audio testing in form
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioTestResult, setAudioTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    duration?: number;
  } | null>(null);

  // Export JSON state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportJson, setExportJson] = useState('');
  const [copied, setCopied] = useState(false);

  // Artist Autocomplete & Dropdown state
  const [isArtistDropdownOpen, setIsArtistDropdownOpen] = useState(false);
  const artistDropdownRef = React.useRef<HTMLDivElement>(null);

  const existingArtists = React.useMemo(() => MusicService.getArtists(), [tracks, isFormOpen]);

  const filteredArtistSuggestions = React.useMemo(() => {
    const q = artist.trim().toLowerCase();
    if (!q) return existingArtists;
    return existingArtists.filter((a) => a.name.toLowerCase().includes(q));
  }, [existingArtists, artist]);

  const exactArtistMatch = React.useMemo(() => {
    const q = artist.trim().toLowerCase();
    if (!q) return null;
    return existingArtists.find((a) => a.name.trim().toLowerCase() === q) || null;
  }, [existingArtists, artist]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (artistDropdownRef.current && !artistDropdownRef.current.contains(event.target as Node)) {
        setIsArtistDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshCatalog = () => {
    setTracks(MusicService.getAllTracks('newest', true));
    setBanner(MusicService.getHeroBanner());
  };

  const handleOpenAddForm = () => {
    setEditingTrackId(null);
    setAudioSourceType('youtube');
    setTitle('');
    setArtist('Habajaba Studio LIVE');
    setAlbum('');
    setGenre('Acoustic Live');
    setCoverUrl('/banner-default.svg');
    setAudioUrl('');
    setYoutubeVideoId('');
    setDuration('');
    setFeatured(false);
    setPublished(true);
    setAudioTestResult(null);
    setIsFormOpen(true);
  };

  const handleEditTrack = (t: Track) => {
    setEditingTrackId(t.id);
    const isYt = isYouTubeUrl(t.audioUrl) || !!t.youtubeId || t.sourceType === 'youtube';
    setAudioSourceType(isYt ? 'youtube' : 'dropbox');
    setTitle(t.title);
    setArtist(t.artist);
    setAlbum(t.album || '');
    setGenre(t.genre || 'Acoustic Live');
    setCoverUrl(t.coverUrl || '/banner-default.svg');
    setAudioUrl(t.audioUrl);
    setYoutubeVideoId(t.youtubeId || extractYouTubeVideoId(t.audioUrl) || '');
    setDuration(t.duration || '');
    setFeatured(t.featured || false);
    setPublished(t.published !== false);
    setAudioTestResult(null);
    setIsFormOpen(true);
  };

  // Handle YouTube URL input change with auto metadata extraction
  const handleYouTubeUrlChange = async (url: string) => {
    setAudioUrl(url);
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      setYoutubeVideoId(videoId);
      const ytThumb = getYouTubeThumbnail(videoId, 'hq');
      // If cover is default, auto set YouTube HD thumbnail
      if (!coverUrl || coverUrl === '/banner-default.svg' || coverUrl.includes('img.youtube.com')) {
        setCoverUrl(ytThumb);
      }
      setAudioTestResult({
        tested: true,
        success: true,
        message: `ইউটিউব ভিডিও শনাক্ত হয়েছে (ID: ${videoId})।`,
      });

      // Auto-fetch title & channel from public oEmbed
      try {
        const meta = await fetchYouTubeMetadata(videoId);
        if (meta) {
          if (!title.trim() && meta.title) {
            setTitle(meta.title);
          }
          if ((!artist.trim() || artist === 'Habajaba Studio LIVE') && meta.author) {
            setArtist(meta.author);
          }
          if (meta.thumbnailUrl) {
            setCoverUrl(meta.thumbnailUrl);
          }
        }
      } catch {}
    } else {
      setYoutubeVideoId('');
    }
  };

  const handleTestAudio = async () => {
    if (!audioUrl.trim()) return;

    if (audioSourceType === 'youtube') {
      const vid = youtubeVideoId || extractYouTubeVideoId(audioUrl);
      if (!vid) {
        setAudioTestResult({
          tested: true,
          success: false,
          message: 'সঠিক ইউটিউব ভিডিও লিংক দিন।',
        });
        return;
      }

      setIsTestingAudio(true);
      // Play immediately in app player to test
      playTrack({
        id: 'test-track',
        title: title || 'ইউটিউব অডিও টেস্ট',
        artist: artist || 'Habajaba Studio LIVE',
        album: album || 'Test',
        genre: genre,
        coverUrl: coverUrl || getYouTubeThumbnail(vid, 'hq'),
        audioUrl: audioUrl,
        duration: duration || '03:30',
        language: 'Bengali',
        releaseDate: new Date().toISOString().split('T')[0],
        featured: false,
        published: true,
        youtubeId: vid,
        sourceType: 'youtube',
      });
      setIsTestingAudio(false);
      setAudioTestResult({
        tested: true,
        success: true,
        message: 'প্লেয়ারে ইউটিউব অডিও চালু হয়েছে!',
      });
      return;
    }

    // Dropbox audio test
    setIsTestingAudio(true);
    setAudioTestResult(null);
    const test = await testAudioStreamability(audioUrl);
    setIsTestingAudio(false);

    setAudioTestResult({
      tested: true,
      success: test.success,
      message: test.message,
      duration: test.duration,
    });

    if (test.duration && isFinite(test.duration)) {
      const mins = Math.floor(test.duration / 60);
      const secs = Math.floor(test.duration % 60);
      setDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    }
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCoverUploading(true);
    try {
      const uploadResult = await uploadImageToCloud(file, 'banners', {
        maxWidth: 960,
        maxHeight: 540,
        quality: 0.70,
        format: 'image/jpeg',
      });
      setCoverUrl(uploadResult.url);
    } catch (err) {
      console.error('Failed to process cover image:', err);
      alert('ইমেজ প্রসেস করতে সমস্যা হয়েছে।');
    } finally {
      setIsCoverUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !audioUrl.trim()) {
      alert('গানের শিরোনাম ও অডিও লিঙ্ক দিন।');
      return;
    }

    const ytId = audioSourceType === 'youtube'
      ? (youtubeVideoId || extractYouTubeVideoId(audioUrl) || undefined)
      : undefined;

    const trackData: Track = {
      id: editingTrackId || `habajaba-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim() || 'Habajaba Studio LIVE',
      album: album.trim(),
      genre: genre.trim() || 'Acoustic Live',
      coverUrl: coverUrl.trim() || (ytId ? getYouTubeThumbnail(ytId, 'hq') : '/banner-default.svg'),
      audioUrl: audioUrl.trim(),
      duration: duration.trim() || '03:30',
      language: 'Bengali',
      releaseDate: new Date().toISOString().split('T')[0],
      featured: featured,
      published: published,
      youtubeId: ytId,
      sourceType: ytId ? 'youtube' : 'dropbox',
    };

    if (editingTrackId) {
      await MusicService.updateTrack(trackData);
    } else {
      await MusicService.addTrack(trackData);
    }

    setIsFormOpen(false);
    refreshCatalog();
  };

  const handleDeleteTrack = async (id: string, songTitle: string) => {
    if (confirm(`আপনি কি "${songTitle}" গানটি মুছে ফেলতে চান?`)) {
      await MusicService.deleteTrack(id);
      refreshCatalog();
    }
  };

  const handleTogglePublish = async (id: string) => {
    await MusicService.togglePublishTrack(id);
    refreshCatalog();
  };

  const handleExportJson = () => {
    const json = MusicService.exportCatalogJson();
    setExportJson(json);
    setShowExportModal(true);
  };

  const handleCopyJson = () => {
    navigator.clipboard?.writeText(exportJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_SECRET_PIN) {
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, ADMIN_SECRET_PIN);
      } catch {}
      setIsAuthorized(true);
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('ভুল সিকিউরিটি পিন! সঠিক পিন দিন।');
      setPinInput('');
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 6) {
      const next = pinInput + digit;
      setPinInput(next);
      setPinError(null);
      if (next.length === 6) {
        if (next === ADMIN_SECRET_PIN) {
          try {
            sessionStorage.setItem(ADMIN_SESSION_KEY, ADMIN_SECRET_PIN);
          } catch {}
          setIsAuthorized(true);
          setPinError(null);
          setPinInput('');
        } else {
          setPinError('ভুল সিকিউরিটি পিন!');
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handleLockAdmin = () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
    setIsAuthorized(false);
    setPinInput('');
    setPinError(null);
  };

  // PIN Verification View
  if (!isAuthorized) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/15 p-6 shadow-2xl text-center space-y-5 text-white">
          <div className="w-14 h-14 rounded-2xl bg-[#ED1025]/20 text-[#ED1025] border border-[#ED1025]/30 flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">এডমিন সিকিউরিটি</h2>
            <p className="text-xs text-neutral-400 font-bengali">
              প্রবেশ করতে ৬-সংখ্যার সিকিউরিটি পিন দিন।
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(null);
              }}
              placeholder="••••••"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl border border-white/20 focus:border-[#ED1025] focus:outline-hidden bg-black/60 text-white font-bold"
              autoFocus
            />

            {pinError && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold font-bengali flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#ED1025]" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base transition-colors active:scale-95 cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="h-11 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-400 font-semibold text-xs transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base transition-colors active:scale-95 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinInput((prev) => prev.slice(0, -1))}
                className="h-11 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-400 font-semibold text-xs transition-colors cursor-pointer"
              >
                ⌫
              </button>
            </div>

            <button
              type="submit"
              disabled={pinInput.length < 6}
              className="w-full py-2.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
            >
              <KeyRound className="w-4 h-4" />
              <span>আনলক করুন</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 text-white">
      {/* Clean Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>এডমিন প্যানেল</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ED1025] text-white">
              CONTROL
            </span>
          </h1>
          <p className="text-xs text-neutral-400 font-bengali mt-0.5">
            গান, ব্যানার, প্রোফাইল ও ক্লাউড সিঙ্ক পরিচালনা
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="min-h-[38px] px-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-[#ED1025]" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleOpenAddForm}
            className="min-h-[38px] px-4 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#ED1025]/30 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন গান যোগ করুন</span>
          </button>

          <button
            onClick={handleLockAdmin}
            className="min-h-[38px] px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-neutral-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="লক করুন"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লক</span>
          </button>
        </div>
      </div>

      {/* Streamlined Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setAdminTab('banners')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'banners'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>৪টি স্লাইডিং ব্যানার</span>
        </button>

        <button
          onClick={() => setAdminTab('songs')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'songs'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>গান তালিকা ({tracks.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('artists')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'artists'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>শিল্পী ও প্রোফাইল</span>
        </button>

        <button
          onClick={() => setAdminTab('branding')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'branding'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>লোগো ও ব্র্যান্ডিং</span>
        </button>

        <button
          onClick={() => setAdminTab('firebase')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'firebase'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>ফায়ারবেস ক্লাউড</span>
        </button>

        <button
          onClick={() => setAdminTab('offline')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'offline'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>অফলাইন ক্যাশ</span>
        </button>
      </div>

      {/* Tab: Sliding Banners */}
      {adminTab === 'banners' && <SlidingBannersAdminSection />}

      {/* Tab: Artists Profile */}
      {adminTab === 'artists' && <ArtistsAdminSection />}

      {/* Tab: Branding & YouTube */}
      {adminTab === 'branding' && <BrandingAdminSection />}

      {/* Tab: Firebase Cloud */}
      {adminTab === 'firebase' && <FirebaseAdminSection />}

      {/* Tab: Offline Cache */}
      {adminTab === 'offline' && <OfflineAdminSection />}

      {/* Tab: Songs Manager */}
      {adminTab === 'songs' && (
        <section className="bg-black/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl space-y-4 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-[#ED1025]" />
              <span>গান তালিকা ({tracks.length} টি গান)</span>
            </h2>

            <button
              onClick={handleOpenAddForm}
              className="px-3 py-1.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন গান</span>
            </button>
          </div>

          {tracks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">কভার</th>
                    <th className="py-2.5 px-3">শিরোনাম ও শিল্পী</th>
                    <th className="py-2.5 px-3">সোর্স</th>
                    <th className="py-2.5 px-3">জঁর / অ্যালবাম</th>
                    <th className="py-2.5 px-3">সময়</th>
                    <th className="py-2.5 px-3">স্ট্যাটাস</th>
                    <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {tracks.map((t) => {
                    const isCurrent = currentTrack?.id === t.id && isPlaying;
                    const isYt = isYouTubeUrl(t.audioUrl) || !!t.youtubeId || t.sourceType === 'youtube';

                    return (
                      <tr key={t.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="w-16 aspect-video rounded-lg overflow-hidden border border-white/15 bg-neutral-900 relative">
                            <CoverImage
                              src={t.coverUrl}
                              alt={t.title}
                              title={t.title}
                              aspectRatio="video"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white text-xs">{t.title}</div>
                          <div className="text-[11px] text-neutral-400">{t.artist}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          {isYt ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 inline-flex items-center gap-1 font-mono">
                              <Youtube className="w-3 h-3 text-[#ED1025]" />
                              <span>YouTube</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1 font-mono">
                              <span>Dropbox</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-medium text-neutral-200">{t.genre}</div>
                          <div className="text-[10px] text-neutral-400">{t.album || '—'}</div>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-neutral-400 text-xs">
                          {t.duration || '--:--'}
                        </td>

                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleTogglePublish(t.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              t.published
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-white/10 text-neutral-400 border border-white/10'
                            }`}
                          >
                            {t.published ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                if (currentTrack?.id === t.id) {
                                  togglePlay();
                                } else {
                                  playTrack(t);
                                }
                              }}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-[#ED1025] text-white shadow-xs'
                                  : 'bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white'
                              }`}
                              title={isCurrent ? 'Pause' : 'Play test'}
                            >
                              {isCurrent ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            </button>

                            <button
                              onClick={() => handleEditTrack(t)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
                              title="Edit song"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleDeleteTrack(t.id, t.title)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-600/80 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
                              title="Delete song"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400 text-xs font-bengali">
              কোনো গান পাওয়া যায়নি। উপরে &quot;নতুন গান যোগ করুন&quot; বাটনে চাপুন।
            </div>
          )}
        </section>
      )}

      {/* Add / Edit Song Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#121319] rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-white/15 space-y-4 my-4 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-[#ED1025]" />
                <span>{editingTrackId ? 'গান সম্পাদনা করুন' : 'নতুন গান আপলোড করুন'}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrack} className="space-y-3.5 text-xs">
              {/* Audio Source Selector */}
              <div>
                <label className="font-bold text-neutral-300 block mb-1.5 font-bengali">
                  অডিও সোর্স নির্বাচন করুন (Select Audio Source):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAudioSourceType('youtube')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      audioSourceType === 'youtube'
                        ? 'bg-red-600/30 text-white border-red-500 shadow-xs'
                        : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Youtube className="w-4 h-4 text-[#ED1025]" />
                    <span>ইউটিউব ভিডিও লিঙ্ক</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudioSourceType('dropbox')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      audioSourceType === 'dropbox'
                        ? 'bg-blue-600/30 text-white border-blue-500 shadow-xs'
                        : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-blue-400" />
                    <span>ড্রপবক্স অডিও লিঙ্ক</span>
                  </button>
                </div>
              </div>

              {/* YouTube URL input or Dropbox link input */}
              {audioSourceType === 'youtube' ? (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                  <label className="font-bold text-white block">
                    ইউটিউব ভিডিও লিঙ্ক (YouTube Video Link) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={audioUrl}
                      onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... অথবা https://youtu.be/..."
                      className="flex-1 px-3 py-2 rounded-lg border border-white/15 bg-black/60 text-white font-mono text-xs focus:border-[#ED1025] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleTestAudio}
                      disabled={isTestingAudio || !audioUrl.trim()}
                      className="px-3 py-2 bg-[#ED1025] hover:bg-[#D90D20] text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isTestingAudio ? 'টেস্ট...' : 'টেস্ট'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-bengali">
                    ইউটিউব লিঙ্ক দিলেই অডিও স্বয়ংক্রিয়ভাবে জেনারেট হয়ে লাইভ সার্ভারে সবার ডিভাইসে চলবে।
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <label className="font-bold text-white block">
                    ড্রপবক্স অডিও লিঙ্ক (Dropbox Audio Link) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={audioUrl}
                      onChange={(e) => {
                        setAudioUrl(e.target.value);
                        setAudioTestResult(null);
                      }}
                      placeholder="https://www.dropbox.com/scl/fi/... অথবা সরাসরি mp3 লিঙ্ক"
                      className="flex-1 px-3 py-2 rounded-lg border border-white/15 bg-black/60 text-white font-mono text-xs focus:border-[#ED1025] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleTestAudio}
                      disabled={isTestingAudio || !audioUrl.trim()}
                      className="px-3 py-2 bg-[#ED1025] hover:bg-[#D90D20] text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isTestingAudio ? 'টেস্ট...' : 'টেস্ট'}</span>
                    </button>
                  </div>
                </div>
              )}

              {audioTestResult && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    audioTestResult.success
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {audioTestResult.success ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium">{audioTestResult.message}</span>
                </div>
              )}

              {/* Title & Artist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">
                    গানের শিরোনাম (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="গানের নাম লিখুন"
                    className="w-full px-3 py-2 rounded-lg border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div className="relative" ref={artistDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-neutral-300 block text-xs sm:text-sm">
                      শিল্পী (Artist) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsArtistDropdownOpen(!isArtistDropdownOpen)}
                      className="text-[11px] text-[#ED1025] hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
                    >
                      <span>{isArtistDropdownOpen ? 'তালিকা লুকান' : 'শিল্পী তালিকা'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isArtistDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={artist}
                      onFocus={() => setIsArtistDropdownOpen(true)}
                      onChange={(e) => {
                        setArtist(e.target.value);
                        setIsArtistDropdownOpen(true);
                      }}
                      placeholder="শিল্পী নির্বাচন করুন বা নতুন শিল্পীর নাম লিখুন"
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden text-sm"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setIsArtistDropdownOpen(!isArtistDropdownOpen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isArtistDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Suggestion & Dropdown Menu */}
                  {isArtistDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#161720] border border-white/20 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                      <div className="p-2 border-b border-white/10 text-[10px] font-bold text-neutral-400 px-3 flex items-center justify-between bg-black/50">
                        <span>বিদ্যমান শিল্পী ({existingArtists.length} জন)</span>
                        <span className="text-[10px] text-neutral-500">ক্লিক করে নির্বাচন করুন</span>
                      </div>

                      {filteredArtistSuggestions.length > 0 ? (
                        <div className="divide-y divide-white/5">
                          {filteredArtistSuggestions.map((a) => {
                            const isSelected = a.name.trim().toLowerCase() === artist.trim().toLowerCase();
                            return (
                              <button
                                key={a.id || a.name}
                                type="button"
                                onClick={() => {
                                  setArtist(a.name);
                                  setIsArtistDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#ED1025]/20 text-white font-bold'
                                    : 'hover:bg-white/10 text-neutral-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 border border-white/20 shrink-0 flex items-center justify-center text-xs font-bold text-white">
                                    {a.avatarUrl ? (
                                      <img
                                        src={a.avatarUrl}
                                        alt={a.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/logo.svg';
                                        }}
                                      />
                                    ) : (
                                      a.name.charAt(0) || 'A'
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                                      <span>{a.name}</span>
                                      {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 truncate">
                                      {a.role || 'শিল্পী'} · {(a as any).trackCount ? `${(a as any).trackCount}টি গান` : 'রেকর্ডেড'}
                                    </div>
                                  </div>
                                </div>

                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                  বিদ্যমান
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 text-center">
                          <p className="text-xs text-neutral-300">
                            "{artist}" নামে কোনো পূর্ববর্তী শিল্পী নেই
                          </p>
                          <p className="text-[11px] text-amber-300 mt-1 font-bengali">
                            ✨ নতুন শিল্পী: সংরক্ষণ করলে এটি নতুনের দলে নতুন প্রোফাইল হিসেবে তৈরি হবে।
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Realtime Artist Link Status Indicator */}
                  <div className="mt-1.5">
                    {exactArtistMatch ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 rounded-lg">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          বিদ্যমান প্রোফাইল: <b>{exactArtistMatch.name}</b> (এই প্রোফাইলেই গানটি যুক্ত হবে)
                        </span>
                      </div>
                    ) : artist.trim() ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-1 rounded-lg">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                          নতুনের দল: <b>{artist.trim()}</b> (সংরক্ষণ করলে নতুন প্রোফাইল তৈরি হবে)
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Album & Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">
                    অ্যালবাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="অ্যালবামের নাম"
                    className="w-full px-3 py-2 rounded-lg border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">
                    জঁর (Genre)
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-white/15 bg-neutral-900 text-white focus:border-[#ED1025] focus:outline-hidden"
                  >
                    <option value="Acoustic Live">Acoustic Live (অ্যাকোস্টিক লাইভ)</option>
                    <option value="Romantic">Romantic (রোমান্টিক)</option>
                    <option value="Folk Fusion">Folk Fusion (ফোক ফিউশন)</option>
                    <option value="Rabindra Sangeet">Rabindra Sangeet (রবীন্দ্র সঙ্গীত)</option>
                    <option value="Indie Bengali">Indie Bengali (ইন্ডি বাংলা)</option>
                  </select>
                </div>
              </div>

              {/* 16:9 Cover Thumbnail */}
              <div className="space-y-2">
                <label className="font-bold text-neutral-300 block">
                  ১৬:৯ ব্যানার ও কভার ইমেজ
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-24 aspect-video rounded-lg overflow-hidden border border-white/15 bg-neutral-900 shrink-0 relative">
                    <img
                      src={coverUrl || '/banner-default.svg'}
                      alt="Thumbnail preview"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/banner-default.svg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="ইমেজ লিঙ্ক পেস্ট করুন"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>{isCoverUploading ? 'আপলোড হচ্ছে...' : 'ডিভাইস থেকে ফাইল নির্বাচন'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Duration & Options */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-neutral-300">সময়কাল:</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="03:45"
                    className="w-20 px-2 py-1 rounded-lg border border-white/15 bg-black/60 text-white text-center font-mono focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-neutral-300">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#ED1025]"
                    />
                    <span>পাবলিক প্রকাশ</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-neutral-300">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#ED1025]"
                    />
                    <span>ফিচার্ড</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold shadow-md shadow-[#ED1025]/30 transition-colors cursor-pointer"
                >
                  {editingTrackId ? 'আপডেট করুন' : 'গান যোগ ও লাইভ সেভ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export JSON Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#121319] rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-white/15 space-y-3 max-h-[85vh] flex flex-col text-white">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">
                music.json এক্সপোর্ট করুন
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              readOnly
              value={exportJson}
              rows={10}
              className="w-full text-[11px] font-mono p-3 bg-black/70 text-neutral-200 rounded-xl border border-white/15 resize-none focus:outline-hidden"
            />

            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-neutral-400">
                {copied ? 'কপি সম্পন্ন!' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-4 py-1.5 bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
