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
  ChevronDown,
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
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
import { CommentsAdminSection } from '../components/CommentsAdminSection';
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
  const [adminTab, setAdminTab] = useState<'songs' | 'banners' | 'artists' | 'comments' | 'branding' | 'firebase' | 'offline'>('songs');

  // In-Page View Mode: 'catalog' | 'song-form' | 'export-json' (NO POPUPS)
  const [viewMode, setViewMode] = useState<'catalog' | 'song-form' | 'export-json'>('catalog');

  const [tracks, setTracks] = useState<Track[]>(() =>
    MusicService.getAllTracks('newest', true)
  );
  const [banner, setBanner] = useState<HeroBannerConfig>(() =>
    MusicService.getHeroBanner()
  );

  // In-Page Delete Confirmation (NO POPUP)
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);

  // In-app Toast alert for instant feedback
  const [toastAlert, setToastAlert] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastAlert({ show: true, message, type });
    setTimeout(() => setToastAlert((prev) => ({ ...prev, show: false })), 3500);
  };

  // Form state for creating / editing track in-page
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
  const [exportJson, setExportJson] = useState('');
  const [copied, setCopied] = useState(false);

  // Artist Autocomplete & Dropdown state
  const [isArtistDropdownOpen, setIsArtistDropdownOpen] = useState(false);
  const artistDropdownRef = React.useRef<HTMLDivElement>(null);

  const existingArtists = React.useMemo(() => MusicService.getArtists(), [tracks, viewMode]);

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
    setTrackToDelete(null);
    setViewMode('song-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditTrack = (t: Track) => {
    setEditingTrackId(t.id);
    const isYt = isYouTubeUrl(t.audioUrl) || !!t.youtubeId || t.sourceType === 'youtube';
    setAudioSourceType(isYt ? 'youtube' : 'dropbox');
    setTitle(t.title);
    setArtist(t.artist);
    setAlbum(t.album || '');
    setGenre(t.genre);
    setCoverUrl(t.coverUrl);
    setAudioUrl(t.audioUrl);
    setYoutubeVideoId(t.youtubeId || (isYt ? extractYouTubeVideoId(t.audioUrl) || '' : ''));
    setDuration(t.duration);
    setFeatured(t.featured || false);
    setPublished(t.published);
    setAudioTestResult(null);
    setTrackToDelete(null);
    setViewMode('song-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelSongForm = () => {
    setViewMode('catalog');
    setEditingTrackId(null);
  };

  const handleYouTubeUrlChange = async (url: string) => {
    setAudioUrl(url);
    const vid = extractYouTubeVideoId(url);
    if (vid) {
      setYoutubeVideoId(vid);
      if (!coverUrl || coverUrl === '/banner-default.svg') {
        setCoverUrl(getYouTubeThumbnail(vid, 'hq'));
      }
      const meta = await fetchYouTubeMetadata(vid);
      if (meta && meta.title && !title) {
        let cleanTitle = meta.title.replace(/Habajaba Studio|Official Music Video|Studio LIVE|\[.*?\]|\(.*?\)/gi, '').trim();
        cleanTitle = cleanTitle.replace(/^[-|:\s]+|[-|:\s]+$/g, '').trim();
        if (cleanTitle) setTitle(cleanTitle);
      }
    }
  };

  const handleTestAudio = async () => {
    if (!audioUrl.trim()) return;

    if (audioSourceType === 'youtube' || isYouTubeUrl(audioUrl)) {
      const vid = youtubeVideoId || extractYouTubeVideoId(audioUrl);
      if (!vid) {
        setAudioTestResult({
          tested: true,
          success: false,
          message: 'ইউটিউব লিঙ্ক থেকে ভিডিও আইডি পাওয়া যায়নি।',
        });
        return;
      }

      playTrack({
        id: 'test-preview',
        title: title || 'YouTube Preview',
        artist: artist || 'Habajaba Studio LIVE',
        album: '',
        genre: 'Acoustic Live',
        coverUrl: coverUrl || getYouTubeThumbnail(vid, 'hq'),
        audioUrl: audioUrl,
        duration: '03:30',
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
      showToast('কভার ছবি সফলভাবে প্রসেস হয়েছে!', 'success');
    } catch (err) {
      console.error('Failed to process cover image:', err);
      showToast('ইমেজ প্রসেস করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsCoverUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Instant optimistic save
  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !audioUrl.trim()) {
      showToast('গানের শিরোনাম ও অডিও লিঙ্ক দিন।', 'error');
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

    // Return to catalog immediately for instant zero-lag response
    setViewMode('catalog');

    // Optimistic local update
    if (editingTrackId) {
      setTracks((prev) => prev.map((t) => (t.id === trackData.id ? trackData : t)));
      MusicService.updateTrack(trackData).catch(() => {});
      showToast(`"${trackData.title}" সফলভাবে আপডেট করা হয়েছে! ⚡`, 'success');
    } else {
      setTracks((prev) => [trackData, ...prev]);
      MusicService.addTrack(trackData).catch(() => {});
      showToast(`"${trackData.title}" নতুন গান যোগ ও সংরক্ষিত হয়েছে! ⚡`, 'success');
    }

    refreshCatalog();
  };

  // In-page delete confirmation handler
  const handleConfirmDeleteTrack = async () => {
    if (!trackToDelete) return;
    const songId = trackToDelete.id;
    const songTitle = trackToDelete.title;
    setTrackToDelete(null);

    // 1. Optimistic removal from table
    setTracks((prev) => prev.filter((t) => t.id !== songId));

    // 2. Background service purge
    try {
      await MusicService.deleteTrack(songId);
      showToast(`"${songTitle}" গানটি সফলভাবে মুছে ফেলা হয়েছে!`, 'success');
    } catch (e) {
      console.warn('Delete track warning:', e);
    }

    refreshCatalog();
  };

  const handleTogglePublish = async (id: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, published: !t.published } : t))
    );
    await MusicService.togglePublishTrack(id);
    refreshCatalog();
  };

  const handleExportJson = () => {
    const json = MusicService.exportCatalogJson();
    setExportJson(json);
    setViewMode('export-json');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                className="h-11 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 font-semibold text-xs transition-colors cursor-pointer"
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
                onClick={() => setPinInput((p) => p.slice(0, -1))}
                className="h-11 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 font-semibold text-xs transition-colors cursor-pointer"
              >
                Del
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

  // 1. FULL IN-PAGE SONG FORM VIEW (NO POPUP)
  if (viewMode === 'song-form') {
    return (
      <div className="w-full max-w-none space-y-5 pb-16 text-white">
        {/* Navigation & Header Bar */}
        <div className="p-4 sm:p-5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCancelSongForm}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>গান তালিকায় ফিরে যান</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-[#ED1025] flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-bengali">
                {editingTrackId ? `গান সম্পাদনা: "${title}"` : 'নতুন গান আপলোড ও প্রকাশ'}
              </h2>
              <p className="text-xs text-neutral-400 font-bengali">
                সম্পূর্ণ স্ক্রিন জুড়ে বড় ও আরামদায়ক এডিটর (কোনো পপআপ ছাড়া)।
              </p>
            </div>
          </div>
        </div>

        {/* Full In-Page Spacious Form */}
        <form onSubmit={handleSaveTrack} className="p-5 sm:p-8 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column: Metadata */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 font-bengali flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ED1025]" />
                <span>গানের সাধারণ তথ্য</span>
              </h3>

              <div>
                <label className="font-bold text-neutral-300 block mb-1.5 font-bengali">
                  গানের শিরোনাম (Song Title) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: মন কেমনের গান"
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-black/60 text-white text-sm focus:border-[#ED1025] focus:outline-hidden"
                />
              </div>

              {/* Artist with In-page Dropdown */}
              <div className="relative" ref={artistDropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-neutral-300 block text-xs sm:text-sm font-bengali">
                    শিল্পী (Artist / Vocalist) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsArtistDropdownOpen(!isArtistDropdownOpen)}
                    className="text-xs text-[#ED1025] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>{isArtistDropdownOpen ? 'তালিকা লুকান' : 'শিল্পী তালিকা দেখুন'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isArtistDropdownOpen ? 'rotate-180' : ''}`} />
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
                    className="w-full px-4 py-3 pr-9 rounded-xl border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden text-sm"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setIsArtistDropdownOpen(!isArtistDropdownOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isArtistDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isArtistDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#161720] border border-white/20 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                    <div className="p-2.5 border-b border-white/10 text-[11px] font-bold text-neutral-400 px-3 flex items-center justify-between bg-black/50">
                      <span>বিদ্যমান শিল্পী ({existingArtists.length} জন)</span>
                      <span className="text-neutral-500">ক্লিক করে নির্বাচন করুন</span>
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
                              className={`w-full p-3 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#ED1025]/20 text-white font-bold'
                                  : 'hover:bg-white/10 text-neutral-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-white/20 shrink-0 flex items-center justify-center text-xs font-bold text-white">
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
                                  <div className="text-xs sm:text-sm font-semibold text-white truncate flex items-center gap-1.5">
                                    <span>{a.name}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                  </div>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                বিদ্যমান শিল্পী
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-neutral-300">
                          "{artist}" নামে কোনো পূর্ববর্তী শিল্পী নেই
                        </p>
                        <p className="text-xs text-amber-300 mt-1 font-bengali">
                          ✨ নতুন শিল্পী: গান সেভ করলে স্বয়ংক্রিয়ভাবে একটি নতুন শিল্পী প্রোফাইল তৈরি হবে।
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Album & Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1.5 font-bengali">
                    অ্যালবাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="যেমন: অ্যাকোস্টিক ভলিউম ১"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white text-sm focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1.5 font-bengali">
                    জঁর (Genre)
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-neutral-900 text-white text-sm focus:border-[#ED1025] focus:outline-hidden"
                  >
                    <option value="Acoustic Live">Acoustic Live (অ্যাকোস্টিক লাইভ)</option>
                    <option value="Romantic">Romantic (রোমান্টিক)</option>
                    <option value="Folk Fusion">Folk Fusion (ফোক ফিউশন)</option>
                    <option value="Rabindra Sangeet">Rabindra Sangeet (রবীন্দ্র সঙ্গীত)</option>
                    <option value="Indie Bengali">Indie Bengali (ইন্ডি বাংলা)</option>
                  </select>
                </div>
              </div>

              {/* Duration & Options */}
              <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-neutral-300 font-bengali">সময়কাল:</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="03:45"
                    className="w-24 px-3 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-center font-mono focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-neutral-200">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="w-4 h-4 accent-[#ED1025]"
                    />
                    <span>পাবলিক প্রকাশ</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-neutral-200">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 accent-[#ED1025]"
                    />
                    <span>ফিচার্ড</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Audio & Cover */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 font-bengali flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ED1025]" />
                <span>অডিও সোর্স ও কভার ছবি</span>
              </h3>

              {/* Source Selector Buttons */}
              <div>
                <label className="font-bold text-neutral-300 block mb-2 font-bengali">
                  অডিও সোর্স নির্বাচন করুন (Select Audio Source):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAudioSourceType('youtube')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
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
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
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

              {/* Audio URL Input */}
              {audioSourceType === 'youtube' ? (
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2.5">
                  <label className="font-bold text-white block text-xs">
                    ইউটিউব ভিডিও লিঙ্ক (YouTube Video URL) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={audioUrl}
                      onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-white/15 bg-black/60 text-white font-mono text-xs focus:border-[#ED1025] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleTestAudio}
                      disabled={isTestingAudio || !audioUrl.trim()}
                      className="px-4 py-2.5 bg-[#ED1025] hover:bg-[#D90D20] text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer text-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isTestingAudio ? 'টেস্ট...' : 'টেস্ট'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-bengali">
                    ইউটিউব লিঙ্ক পেস্ট করলে অডিও ও কভার স্বয়ংক্রিয়ভাবে যুক্ত হবে।
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                  <label className="font-bold text-white block text-xs">
                    ড্রপবক্স শেয়ার লিঙ্ক (Dropbox Direct Link) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://www.dropbox.com/s/..."
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-white/15 bg-black/60 text-white font-mono text-xs focus:border-[#ED1025] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleTestAudio}
                      disabled={isTestingAudio || !audioUrl.trim()}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer text-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isTestingAudio ? 'টেস্ট...' : 'টেস্ট'}</span>
                    </button>
                  </div>
                </div>
              )}

              {audioTestResult && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                    audioTestResult.success
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {audioTestResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium">{audioTestResult.message}</span>
                </div>
              )}

              {/* 16:9 Cover Image */}
              <div className="space-y-2.5 p-4 bg-white/[0.03] rounded-xl border border-white/10">
                <label className="font-bold text-neutral-300 block font-bengali">
                  ১৬:৯ ব্যানার ও কভার ইমেজ
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3.5">
                  <div className="w-full sm:w-36 aspect-video rounded-xl overflow-hidden border border-white/15 bg-neutral-900 shrink-0 relative shadow-md">
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

                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="text"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="ইমেজ লিঙ্ক পেস্ট করুন"
                      className="w-full px-3 py-2 rounded-lg border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
                    />
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isCoverUploading ? 'আপলোড হচ্ছে...' : 'ডিভাইস থেকে কভার আপলোড'}</span>
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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancelSongForm}
              className="px-5 py-2.5 rounded-xl font-semibold text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-7 py-3 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#ED1025]/30 transition-all active:scale-95 cursor-pointer"
            >
              {editingTrackId ? 'গান আপডেট করুন ⚡' : 'গান যোগ ও লাইভ সেভ করুন ⚡'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 2. FULL IN-PAGE EXPORT JSON VIEW (NO POPUP)
  if (viewMode === 'export-json') {
    return (
      <div className="w-full max-w-none space-y-5 pb-16 text-white">
        <div className="p-4 sm:p-5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewMode('catalog')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>গান তালিকায় ফিরে যান</span>
          </button>

          <span className="text-sm font-bold text-white flex items-center gap-2">
            <FileJson className="w-4 h-4 text-[#ED1025]" />
            <span>music.json এক্সপোর্ট</span>
          </span>
        </div>

        <div className="p-5 sm:p-7 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-300 font-bengali">
              সম্পূর্ণ ক্যাটালগ ব্যাকআপ ও কোডবেসের music.json আপডেট করার জন্য নিচের কোড কপি করুন:
            </p>
            <button
              onClick={handleCopyJson}
              className="px-4 py-2 bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'কপি হয়েছে!' : 'Copy JSON'}</span>
            </button>
          </div>

          <textarea
            readOnly
            value={exportJson}
            rows={18}
            className="w-full text-xs font-mono p-4 bg-black/70 text-neutral-200 rounded-xl border border-white/15 resize-none focus:outline-hidden"
          />
        </div>
      </div>
    );
  }

  // 3. FULL IN-PAGE MAIN CATALOG VIEW (NO POPUPS)
  return (
    <div className="w-full max-w-none space-y-4 sm:space-y-6 pb-16 text-white">
      {/* Toast Alert Notification */}
      {toastAlert.show && (
        <div
          className={`fixed top-16 right-4 z-50 p-3.5 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold font-bengali transition-all duration-300 ${
            toastAlert.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200 shadow-emerald-950/50'
              : toastAlert.type === 'error'
              ? 'bg-red-950/95 border-red-500 text-red-200 shadow-red-950/50'
              : 'bg-neutral-900 border-white/20 text-white shadow-black/60'
          }`}
        >
          {toastAlert.type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastAlert.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{toastAlert.message}</span>
        </div>
      )}

      {/* In-Page Delete Confirmation Bar (NO POPUP) */}
      {trackToDelete && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-950/80 border border-red-500/60 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-bengali">
                আপনি কি নিশ্চিতভাবে "{trackToDelete.title}" ({trackToDelete.artist}) গানটি মুছে ফেলতে চান?
              </div>
              <div className="text-xs text-neutral-300 font-bengali mt-0.5">
                এটি লাইভ সার্ভার এবং অফলাইন ক্যাশ থেকে স্থায়ীভাবে ডিলিট হয়ে যাবে।
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setTrackToDelete(null)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-300 cursor-pointer transition-colors"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteTrack}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md cursor-pointer transition-colors"
            >
              হ্যাঁ, নিশ্চিত মুছে ফেলুন
            </button>
          </div>
        </div>
      )}

      {/* Admin Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>এডমিন প্যানেল</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ED1025] text-white tracking-wider">
              FULL CONTROL
            </span>
          </h1>
          <p className="text-xs text-neutral-400 font-bengali mt-0.5">
            গান, ব্যানার, প্রোফাইল, শ্রোতাদের মন্তব্য ও ক্লাউড স্টোরেজ পরিচালনা (ফুল স্ক্রিন প্রপার পেজ ভিউ)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportJson}
            className="min-h-[38px] px-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-[#ED1025]" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleOpenAddForm}
            className="min-h-[38px] px-4 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#ED1025]/30 transition-colors cursor-pointer active:scale-95"
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

      {/* Full-Width Streamlined Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setAdminTab('songs')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'songs'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>গান তালিকা ({tracks.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('banners')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'banners'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>৪টি স্লাইডিং ব্যানার</span>
        </button>

        <button
          onClick={() => setAdminTab('artists')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'artists'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>শিল্পী ও প্রোফাইল</span>
        </button>

        <button
          onClick={() => setAdminTab('comments')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'comments'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>শ্রোতাদের মন্তব্য পরিচালনা</span>
        </button>

        <button
          onClick={() => setAdminTab('branding')}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
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
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
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
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'offline'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>অফলাইন ক্যাশ</span>
        </button>
      </div>

      {/* Tab: Songs Manager (Full width, responsive, clean) */}
      {adminTab === 'songs' && (
        <section className="w-full bg-black/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 shadow-xl space-y-4 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-[#ED1025]" />
                <span>গান তালিকা ({tracks.length} টি গান)</span>
              </h2>
              <p className="text-xs text-neutral-400 font-bengali">
                গান যোগ, সম্পাদনা ও যেকোনো গান মুছে ফেলার পূর্ণ নিয়ন্ত্রণ (সম্পূর্ণ পেজ ভিউ)।
              </p>
            </div>

            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন গান যোগ করুন</span>
            </button>
          </div>

          {tracks.length > 0 ? (
            <div className="w-full overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-white/5 text-neutral-300 uppercase tracking-wider text-[11px] border-b border-white/10 font-bold">
                  <tr>
                    <th className="py-3 px-3.5">কভার</th>
                    <th className="py-3 px-3.5">শিরোনাম ও শিল্পী</th>
                    <th className="py-3 px-3.5">সোর্স</th>
                    <th className="py-3 px-3.5">জঁর / অ্যালবাম</th>
                    <th className="py-3 px-3.5">সময়কাল</th>
                    <th className="py-3 px-3.5">স্ট্যাটাস</th>
                    <th className="py-3 px-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {tracks.map((t) => {
                    const isCurrent = currentTrack?.id === t.id && isPlaying;
                    const isYt = isYouTubeUrl(t.audioUrl) || !!t.youtubeId || t.sourceType === 'youtube';

                    return (
                      <tr key={t.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="w-16 sm:w-20 aspect-video rounded-lg overflow-hidden border border-white/15 bg-neutral-900 relative shrink-0">
                            <CoverImage
                              src={t.coverUrl}
                              alt={t.title}
                              title={t.title}
                              aspectRatio="video"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>

                        <td className="py-3 px-3.5 min-w-[200px]">
                          <div className="font-bold text-white text-sm truncate">{t.title}</div>
                          <div className="text-xs text-neutral-400 truncate">{t.artist}</div>
                        </td>

                        <td className="py-3 px-3.5">
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

                        <td className="py-3 px-3.5">
                          <div className="font-medium text-neutral-200">{t.genre}</div>
                          <div className="text-[11px] text-neutral-400">{t.album || '—'}</div>
                        </td>

                        <td className="py-3 px-3.5 font-mono text-neutral-300 text-xs">
                          {t.duration || '03:30'}
                        </td>

                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(t.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
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

                        <td className="py-3 px-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (currentTrack?.id === t.id) {
                                  togglePlay();
                                } else {
                                  playTrack(t);
                                }
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-[#ED1025] text-white shadow-xs'
                                  : 'bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white'
                              }`}
                              title={isCurrent ? 'Pause' : 'Play test'}
                            >
                              {isCurrent ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditTrack(t)}
                              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
                              title="Edit song"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setTrackToDelete(t)}
                              className="w-8 h-8 rounded-lg bg-red-600/15 hover:bg-red-600 flex items-center justify-center text-red-400 hover:text-white transition-colors cursor-pointer"
                              title="Delete song"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            <div className="text-center py-12 bg-white/[0.02] rounded-2xl border border-dashed border-white/15 text-neutral-400 text-xs font-bengali space-y-2">
              <p>কোনো গান পাওয়া যায়নি।</p>
              <button
                onClick={handleOpenAddForm}
                className="px-4 py-2 rounded-xl bg-[#ED1025] text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>প্রথম গান যোগ করুন</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* Tab: Sliding Banners */}
      {adminTab === 'banners' && <SlidingBannersAdminSection />}

      {/* Tab: Artists Profile */}
      {adminTab === 'artists' && <ArtistsAdminSection />}

      {/* Tab: Listener Comments Management */}
      {adminTab === 'comments' && <CommentsAdminSection />}

      {/* Tab: Branding & YouTube */}
      {adminTab === 'branding' && <BrandingAdminSection />}

      {/* Tab: Firebase Cloud */}
      {adminTab === 'firebase' && <FirebaseAdminSection />}

      {/* Tab: Offline Cache */}
      {adminTab === 'offline' && <OfflineAdminSection />}
    </div>
  );
};
