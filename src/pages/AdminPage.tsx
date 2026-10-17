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
  ExternalLink,
  Save,
  Radio,
  FileJson,
  X,
  Upload,
  Eye,
  EyeOff,
  Cloud,
  Palette,
  HelpCircle,
  Sliders,
  Users,
  Database,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { HeroBannerConfig, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { analyzeAudioUrl, testAudioStreamability } from '../utils/dropbox';
import { useAudio } from '../context/AudioContext';
import { CoverImage } from '../components/CoverImage';
import { BrandingAdminSection } from '../components/BrandingAdminSection';
import { FirebaseAdminSection } from '../components/FirebaseAdminSection';
import { SlidingBannersAdminSection } from '../components/SlidingBannersAdminSection';
import { ArtistsAdminSection } from '../components/ArtistsAdminSection';
import { OfflineAdminSection } from '../components/OfflineAdminSection';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { uploadImageToCloud } from '../services/cloudStorageService';

interface AdminPageProps {
  onOpenDropboxGuide?: () => void;
}

const ADMIN_SECRET_PIN = '152006';
const ADMIN_SESSION_KEY = 'habajaba_admin_authorized';

export const AdminPage: React.FC<AdminPageProps> = ({ onOpenDropboxGuide }) => {
  const { playTrack, isPlaying, currentTrack, togglePlay } = useAudio();

  // Security Lock State (Protected by PIN 152006)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === ADMIN_SECRET_PIN;
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Tab state (Media Hub removed per user request)
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
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Habajaba Studio LIVE');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Acoustic Live');
  const [coverUrl, setCoverUrl] = useState('/banner-default.svg');
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverUploadStatus, setCoverUploadStatus] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে শুধুমাত্র ইমেজ ফাইল (PNG, JPG, WebP) নির্বাচন করুন।');
      return;
    }

    setIsCoverUploading(true);
    setCoverUploadStatus(null);
    try {
      // Upload directly to Firebase Cloud Storage with optimized fallback
      const uploadResult = await uploadImageToCloud(file, 'banners', {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.88,
        format: 'image/jpeg',
      });
      setCoverUrl(uploadResult.url);
      setCoverUploadStatus(
        uploadResult.isCloudStorage
          ? 'Firebase Cloud Storage-এ সফলভাবে সংরক্ষিত হয়েছে'
          : 'অপ্টিমাইজড ব্যানার ইমেজ সফলভাবে লোড হয়েছে'
      );
    } catch (err) {
      console.error('Failed to process cover image:', err);
      alert('ব্যানার ইমেজ প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsCoverUploading(false);
      if (e.target) e.target.value = '';
    }
  };

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
  const [bannerSavedAlert, setBannerSavedAlert] = useState(false);

  const refreshCatalog = () => {
    setTracks(MusicService.getAllTracks('newest', true));
    setBanner(MusicService.getHeroBanner());
  };

  const handleOpenAddForm = () => {
    setEditingTrackId(null);
    setTitle('');
    setArtist('Habajaba Studio LIVE');
    setAlbum('');
    setGenre('Acoustic Live');
    setCoverUrl('/banner-default.svg');
    setAudioUrl('');
    setDuration('');
    setFeatured(false);
    setPublished(true);
    setAudioTestResult(null);
    setIsFormOpen(true);
  };

  const handleOpenAddFormWithAudio = (url: string, dur?: string) => {
    setEditingTrackId(null);
    setTitle('');
    setArtist('Habajaba Studio LIVE');
    setAlbum('');
    setGenre('Acoustic Live');
    setCoverUrl(banner.bannerUrl || '/banner-default.svg');
    setAudioUrl(url);
    setDuration(dur || '');
    setFeatured(false);
    setPublished(true);
    setAudioTestResult(null);
    setIsFormOpen(true);
    setAdminTab('songs');
  };

  const handleEditTrack = (t: Track) => {
    setEditingTrackId(t.id);
    setTitle(t.title);
    setArtist(t.artist);
    setAlbum(t.album || '');
    setGenre(t.genre || 'Acoustic Live');
    setCoverUrl(t.coverUrl || '/banner-default.svg');
    setAudioUrl(t.audioUrl);
    setDuration(t.duration || '');
    setFeatured(t.featured || false);
    setPublished(t.published !== false);
    setAudioTestResult(null);
    setIsFormOpen(true);
  };

  const handleTestAudio = async () => {
    if (!audioUrl.trim()) return;
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

  const handleSaveTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !audioUrl.trim()) {
      alert('গান ও অডিও লিঙ্ক উভয়ই আবশ্যক (Song title and audio link required).');
      return;
    }

    const trackData: Track = {
      id: editingTrackId || `habajaba-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim() || 'Habajaba Studio LIVE',
      album: album.trim(),
      genre: genre.trim() || 'Bengali Music',
      coverUrl: coverUrl.trim() || '/banner-default.svg',
      audioUrl: audioUrl.trim(),
      duration: duration.trim() || '03:30',
      language: 'Bengali',
      releaseDate: new Date().toISOString().split('T')[0],
      featured: featured,
      published: published,
    };

    if (editingTrackId) {
      MusicService.updateTrack(trackData);
    } else {
      MusicService.addTrack(trackData);
    }

    setIsFormOpen(false);
    refreshCatalog();
  };

  const handleDeleteTrack = (id: string, songTitle: string) => {
    if (confirm(`আপনি কি "${songTitle}" গানটি মুছে ফেলতে চান?`)) {
      MusicService.deleteTrack(id);
      refreshCatalog();
    }
  };

  const handleTogglePublish = (id: string) => {
    MusicService.togglePublishTrack(id);
    refreshCatalog();
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    MusicService.saveHeroBanner(banner);
    setBannerSavedAlert(true);
    setTimeout(() => setBannerSavedAlert(false), 2500);
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

  // Add a verified sample track for owner convenience
  const handleAddSampleTrack = () => {
    const sampleTrack: Track = {
      id: `sample-${Date.now()}`,
      title: 'মেঘের ডাক (Megher Daak)',
      artist: 'Habajaba Studio LIVE ft. Sayan',
      album: 'Studio Acoustic Vol. 1',
      coverUrl: '/banner-default.svg',
      audioUrl: 'https://cdn.freesound.org/previews/732/732483_11861866-lq.mp3',
      duration: '03:42',
      language: 'Bengali',
      releaseDate: new Date().toISOString().split('T')[0],
      genre: 'Acoustic Live',
      featured: true,
      published: true,
      description: 'Recorded live with acoustic guitar and cajon.',
    };
    MusicService.addTrack(sampleTrack);
    refreshCatalog();
  };

  // PIN validation handler
  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === ADMIN_SECRET_PIN) {
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, ADMIN_SECRET_PIN);
      } catch {}
      setIsAuthorized(true);
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('ভুল সিকিউরিটি কোড! সঠিক কোড দিয়ে পুনরায় চেষ্টা করুন।');
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
          setPinError('ভুল সিকিউরিটি কোড! সঠিক কোড দিয়ে পুনরায় চেষ্টা করুন।');
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

  // If not authorized, display secure PIN Verification View
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-black/50 backdrop-blur-2xl rounded-3xl border border-white/15 p-6 sm:p-8 shadow-2xl text-center space-y-6 text-white">
          <div className="w-16 h-16 rounded-2xl bg-[#ED1025]/20 text-[#ED1025] border border-[#ED1025]/30 flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ED1025] text-white">
              ADMIN SECURITY GATE
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              এডমিন সিকিউরিটি যাচাই
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 font-bengali leading-relaxed">
              এই নিয়ন্ত্রণ প্যানেলটি শুধুমাত্র অ্যাডমিনিস্ট্রেটরের জন্য সংরক্ষিত। প্রবেশ করতে আপনার ৬-সংখ্যার সিকিউরিটি কোড দিন।
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="••••••"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3.5 px-4 rounded-2xl border-2 border-white/20 focus:border-[#ED1025] focus:outline-hidden bg-black/60 text-white transition-all font-bold"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 cursor-pointer"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold font-bengali flex items-center justify-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#ED1025]" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Virtual Keypad for Smooth Touch Access */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-base transition-colors active:scale-95 cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPinInput('');
                  setPinError(null);
                }}
                className="h-12 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 font-bold text-xs transition-colors active:scale-95 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-base transition-colors active:scale-95 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinInput((prev) => prev.slice(0, -1))}
                className="h-12 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 font-bold text-xs transition-colors active:scale-95 cursor-pointer"
              >
                ⌫ Del
              </button>
            </div>

            <button
              type="submit"
              disabled={pinInput.length < 6}
              className="w-full min-h-[46px] rounded-2xl bg-[#ED1025] hover:bg-[#D90D20] disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#ED1025]/30 transition-all cursor-pointer active:scale-98"
            >
              <KeyRound className="w-4 h-4" />
              <span>আনলক করুন (Unlock Admin)</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-white">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#ED1025] text-white">
              ADMIN CONTROL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              এডমিন প্যানেল (Music &amp; Banner Manager)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium font-bengali">
            গান আপলোড, ড্রপবক্স লিঙ্ক যাচাই, ব্যানার পরিবর্তন ও প্রকাশনা নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenDropboxGuide && (
            <button
              onClick={onOpenDropboxGuide}
              className="min-h-[42px] px-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Dropbox Streaming Helper & Guide"
            >
              <HelpCircle className="w-4 h-4 text-[#ED1025]" />
              <span>Dropbox Guide</span>
            </button>
          )}

          <button
            onClick={handleExportJson}
            className="min-h-[42px] px-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export updated catalog for Vercel deployment"
          >
            <FileJson className="w-4 h-4 text-[#ED1025]" />
            <span>Export music.json</span>
          </button>

          <button
            onClick={handleOpenAddForm}
            className="min-h-[42px] px-4 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#ED1025]/30 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন গান যোগ করুন (Add Song)</span>
          </button>

          {/* Quick Lock / Logout Button */}
          <button
            onClick={handleLockAdmin}
            className="min-h-[42px] px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lock Admin Panel"
          >
            <LogOut className="w-4 h-4 text-neutral-400" />
            <span>লক করুন (Lock)</span>
          </button>
        </div>
      </div>

      {/* Real-time Cloud Status Bar */}
      <div
        className={`p-4 rounded-2xl border backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          MusicService.isFirebaseLive()
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${
              MusicService.isFirebaseLive() ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <div>
            <div className="font-bold flex items-center gap-2">
              <span className="text-white">
                {MusicService.isFirebaseLive()
                  ? '🟢 ফায়ারবেস ক্লাউড লাইভ সক্রিয় (Real-time Live Active)'
                  : '🟡 লোকাল মোড (গান এই ডিভাইসে সংরক্ষিত)'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 font-bengali mt-0.5">
              {MusicService.isFirebaseLive()
                ? 'আপনার গান, অ্যালবাম ও ব্যানার সরাসরি ক্লাউড সার্ভারে লাইভ রয়েছে এবং সব ইউজারের ডিভাইসে রিয়েল-টাইমে আপডেট হচ্ছে।'
                : 'আপনার আপলোড করা গান বর্তমানে এই ডিভাইসে সংরক্ষিত আছে। সব ইউজারের কাছে সরাসরি লাইভ করতে "ফায়ারবেস ক্লাউড লাইভ" ট্যাবে কানেক্ট করুন।'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!MusicService.isFirebaseLive() ? (
            <button
              onClick={() => setAdminTab('firebase')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              ফায়ারবেস লাইভ কানেক্ট করুন
            </button>
          ) : (
            <button
              onClick={async () => {
                const res = await MusicService.syncAllLocalToFirestore();
                if (res.success) {
                  alert(`মোট ${res.count} টি গান ও সেটিংস সফলভাবে ক্লাউডে সিঙ্ক হয়েছে!`);
                } else {
                  alert(`সিঙ্ক ব্যর্থ: ${res.error}`);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              লাইভ ক্লাউডে সিঙ্ক করুন ({tracks.length} Tracks)
            </button>
          )}
        </div>
      </div>

      {/* Streamlined Admin Tab Switcher (Media Hub removed, clean layout) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setAdminTab('banners')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'banners'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/10 text-neutral-300 hover:text-white hover:bg-white/15 border border-white/10'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>৪টি স্লাইডিং ব্যানার (4 Sliding Banners)</span>
        </button>

        <button
          onClick={() => setAdminTab('songs')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'songs'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/10 text-neutral-300 hover:text-white hover:bg-white/15 border border-white/10'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>গান তালিকা ও আপলোড ({tracks.length} Tracks)</span>
        </button>

        <button
          onClick={() => setAdminTab('artists')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'artists'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/10 text-neutral-300 hover:text-white hover:bg-white/15 border border-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>শিল্পী ও প্রোফাইল (Artists &amp; Bio)</span>
        </button>

        <button
          onClick={() => setAdminTab('branding')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'branding'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/10 text-neutral-300 hover:text-white hover:bg-white/15 border border-white/10'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>লোগো ও ব্র্যান্ডিং (Logo &amp; YouTube)</span>
        </button>

        <button
          onClick={() => setAdminTab('firebase')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'firebase'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/10 text-neutral-300 hover:text-white hover:bg-white/15 border border-white/10'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>ফায়ারবেস ক্লাউড লাইভ (Firebase Live Server)</span>
        </button>

        <button
          onClick={() => setAdminTab('offline')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'offline'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-white/10 text-neutral-300 hover:text-white hover:bg-white/15 border border-white/10'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>অফলাইন ক্যাশ ও PWA (Offline &amp; IndexedDB)</span>
        </button>
      </div>

      {/* Tab 0: 4 Sliding Banners Manager */}
      {adminTab === 'banners' && <SlidingBannersAdminSection />}

      {/* Tab 1: Artists Profile & Bio Manager (Admin Only) */}
      {adminTab === 'artists' && <ArtistsAdminSection />}

      {/* Tab 2: Offline IndexedDB & Service Worker Cache Manager */}
      {adminTab === 'offline' && <OfflineAdminSection />}

      {/* Tab 3: Song Management List */}
      {adminTab === 'songs' && (
        <section className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-[#ED1025]" />
              <span>গানসমূহ ({tracks.length} টি গান)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              ড্রপবক্সের লিঙ্কের মাধ্যমে পরিচালিত গানসমূহ। টাচ বা ক্লিক করলে তাৎক্ষণিক চলবে।
            </p>
          </div>

          {tracks.length === 0 && (
            <button
              onClick={handleAddSampleTrack}
              className="text-xs text-[#ED1025] hover:underline font-semibold cursor-pointer"
            >
              + Add Sample Track to Test
            </button>
          )}
        </div>

        {tracks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">16:9 ব্যানার</th>
                  <th className="py-3 px-3">গানের শিরোনাম ও শিল্পী</th>
                  <th className="py-3 px-3">জঁর / অ্যালবাম</th>
                  <th className="py-3 px-3">সময়</th>
                  <th className="py-3 px-3">স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tracks.map((t) => {
                  const isCurrent = currentTrack?.id === t.id && isPlaying;
                  return (
                    <tr key={t.id} className="hover:bg-white/[0.04] transition-colors">
                      {/* 16:9 YouTube Ratio Thumbnail */}
                      <td className="py-3 px-3">
                        <div className="w-24 aspect-video rounded-lg overflow-hidden border border-white/15 bg-neutral-900 relative">
                          <CoverImage
                            src={t.coverUrl}
                            alt={t.title}
                            title={t.title}
                            aspectRatio="video"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Song Title & Artist */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-sm">{t.title}</div>
                        <div className="text-[11px] text-neutral-400">{t.artist}</div>
                      </td>

                      {/* Genre & Album */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-neutral-200">{t.genre}</div>
                        <div className="text-[11px] text-neutral-400">{t.album || '—'}</div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 font-mono text-neutral-400">
                        {t.duration || '--:--'}
                      </td>

                      {/* Published Toggle */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleTogglePublish(t.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            t.published
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-white/10 text-neutral-400 border border-white/10 hover:bg-white/20'
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

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Play Test */}
                          <button
                            onClick={() => (isCurrent ? togglePlay() : playTrack(t, tracks))}
                            className="w-8 h-8 rounded-full bg-[#ED1025]/20 hover:bg-[#ED1025] hover:text-white text-[#ED1025] flex items-center justify-center transition-colors cursor-pointer"
                            title={isCurrent ? 'Pause' : 'Play Test'}
                          >
                            {isCurrent ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEditTrack(t)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit Track"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteTrack(t.id, t.title)}
                            className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Track"
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
          <div className="p-12 text-center bg-black/40 rounded-2xl border border-dashed border-white/15 space-y-3">
            <Music className="w-10 h-10 text-neutral-400 mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-white">
              কোনো গান আপলোড করা নেই (No Songs Added Yet)
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              আপনার ড্রপবক্সের শেয়ার করা লিঙ্ক দিয়ে আপনার প্রথম গানটি এখনই যুক্ত করুন।
            </p>
            <button
              onClick={handleOpenAddForm}
              className="px-5 py-2.5 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-[#ED1025]/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন গান যোগ করুন (Add Song)</span>
            </button>
          </div>
        )}
      </section>
      )}

      {/* Tab 3: Official Logo & Branding Customizer */}
      {adminTab === 'branding' && (
        <BrandingAdminSection />
      )}

      {/* Tab 4: Firebase Real-Time Cloud Server */}
      {adminTab === 'firebase' && (
        <FirebaseAdminSection />
      )}

      {/* 3. Add / Edit Track Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#121319]/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-white/15 space-y-4 my-6 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">
                {editingTrackId ? 'গান সম্পাদনা করুন (Edit Track)' : 'নতুন গান যোগ করুন (Add New Song)'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrack} className="space-y-4 text-xs">
              {/* Title & Artist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-200 block mb-1">
                    গানের শিরোনাম (Song Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. মেঘের ডাক (Megher Daak)"
                    className="w-full px-3 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-200 block mb-1">
                    শিল্পী (Artist) *
                  </label>
                  <input
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. Habajaba Studio LIVE ft. Sayan"
                    className="w-full px-3 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Album & Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-200 block mb-1">
                    অ্যালবাম (Album Name - Optional)
                  </label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="e.g. Monsoon Sessions Vol. 1"
                    className="w-full px-3 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-200 block mb-1">
                    জঁর (Genre)
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/15 bg-neutral-900 text-white focus:border-[#ED1025] focus:outline-hidden"
                  >
                    <option value="Acoustic Live" className="bg-neutral-900 text-white">Acoustic Live (অ্যাকোস্টিক লাইভ)</option>
                    <option value="Romantic" className="bg-neutral-900 text-white">Romantic (রোমান্টিক)</option>
                    <option value="Folk Fusion" className="bg-neutral-900 text-white">Folk Fusion (ফোক ফিউশন)</option>
                    <option value="Rabindra Sangeet" className="bg-neutral-900 text-white">Rabindra Sangeet (রবীন্দ্র সঙ্গীত)</option>
                    <option value="Indie Bengali" className="bg-neutral-900 text-white">Indie Bengali (ইন্ডি বাংলা)</option>
                    <option value="Classical" className="bg-neutral-900 text-white">Classical (শাস্ত্রীয়)</option>
                  </select>
                </div>
              </div>

              {/* 16:9 YouTube Ratio Banner / Cover Upload */}
              <div className="space-y-2.5">
                <label className="font-bold text-neutral-200 block">
                  16:9 ইউটিউব ব্যানার ও কভার (YouTube 16:9 Banner / Cover) *
                </label>
                
                {/* Direct file upload button */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileUpload}
                    className="hidden"
                    id="song-cover-file-upload"
                  />
                  <label
                    htmlFor="song-cover-file-upload"
                    className="cursor-pointer min-h-[42px] px-4 py-2 bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isCoverUploading ? 'ব্যানার প্রসেস হচ্ছে...' : 'ডিভাইস থেকে ফাইল আপলোড করুন (Upload Banner)'}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setCoverUrl('/banner-default.svg')}
                    className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-[11px] font-semibold text-neutral-200 whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Use Default Banner
                  </button>
                </div>

                {/* Direct link input as secondary option */}
                <div className="pt-1">
                  <div className="text-[11px] text-neutral-400 mb-1">অথবা সরাসরি ইমেজ লিঙ্ক (Optional Image URL):</div>
                  <input
                    type="text"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://... or /banner-default.svg"
                    className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                {/* 16:9 thumbnail preview */}
                <div className="p-3 bg-white/[0.04] rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="w-36 aspect-video rounded-xl overflow-hidden border border-white/15 bg-neutral-900 shrink-0 shadow-xs relative">
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
                  <div className="text-xs text-neutral-300 space-y-1">
                    <p className="font-bold text-white">
                      {coverUploadStatus
                        ? `✅ ${coverUploadStatus}`
                        : coverUrl && coverUrl.startsWith('data:')
                        ? '✅ ডিভাইস ফাইল সফলভাবে যুক্ত হয়েছে'
                        : '১৬:৯ ইউটিউব প্রিভিউ'}
                    </p>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      মোবাইলে এবং প্লেলিস্টে গানটি ১৬:৯ অনুপাতে ডিসপ্লে হবে। গান সেভ করলে এটি স্বয়ংক্রিয়ভাবে ক্লাউডে আপলোড হয়ে যাবে।
                    </p>
                  </div>
                </div>
              </div>

              {/* Dropbox Audio URL & Live Stream Test */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
                <label className="font-bold text-neutral-200 block">
                  ড্রপবক্স অডিও লিঙ্ক (Dropbox Audio Link) *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    required
                    value={audioUrl}
                    onChange={(e) => {
                      setAudioUrl(e.target.value);
                      setAudioTestResult(null);
                    }}
                    placeholder="https://www.dropbox.com/scl/fi/... or direct mp3 link"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleTestAudio}
                    disabled={isTestingAudio || !audioUrl.trim()}
                    className="px-4 py-2.5 bg-[#ED1025] hover:bg-[#D90D20] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isTestingAudio ? 'টেস্ট চলছে...' : 'টেস্ট প্লে (Test)'}</span>
                  </button>
                </div>

                {audioTestResult && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                      audioTestResult.success
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {audioTestResult.success ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{audioTestResult.message}</p>
                      {duration && (
                        <p className="text-[11px] opacity-80 mt-0.5">
                          শনাক্ত করা সময়কাল: {duration}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Duration & Status Switches */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-neutral-200">সময়কাল (Duration):</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="03:45"
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-center font-mono focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-200">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="w-4 h-4 accent-[#ED1025]"
                    />
                    <span>পাবলিক প্রকাশ (Published)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-200">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 accent-[#ED1025]"
                    />
                    <span>ফিচার্ড গান (Featured)</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold shadow-md shadow-[#ED1025]/30 transition-colors cursor-pointer"
                >
                  {editingTrackId ? 'আপডেট করুন (Save Changes)' : 'গান যোগ করুন (Publish Track)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Export JSON Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#121319]/95 backdrop-blur-2xl rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-white/15 space-y-4 max-h-[85vh] flex flex-col text-white">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white">
                music.json এক্সপোর্ট করুন (Export for Vercel/GitHub)
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              আপনি ব্রাউজারে যে পরিবর্তনগুলো করেছেন, তা স্থায়ীভাবে Vercel কোডে সেভ করতে নিচের JSON টি কপি করে <code className="bg-black/50 px-1 py-0.5 rounded text-white border border-white/10">src/data/music.json</code> ফাইলে পেস্ট করে ডিপ্লয় করতে পারেন।
            </p>

            <textarea
              readOnly
              value={exportJson}
              rows={12}
              className="w-full text-[11px] font-mono p-3 bg-black/70 text-neutral-200 rounded-xl border border-white/15 resize-none focus:outline-hidden"
            />

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-neutral-400">
                {copied ? 'ক্লিপবোর্ডে কপি সম্পন্ন!' : 'কপি বাটনে ক্লিক করুন'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-4 py-2 bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl cursor-pointer"
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
