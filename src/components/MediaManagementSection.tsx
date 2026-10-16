import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link,
  Play,
  Pause,
  Check,
  AlertCircle,
  Radio,
  Save,
  Music2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Sliders,
  Copy,
  Layers,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { HeroBannerConfig, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { analyzeAudioUrl, getDirectAudioUrl, testAudioStreamability } from '../utils/dropbox';

interface MediaManagementSectionProps {
  tracks: Track[];
  onOpenSongFormWithAudio?: (audioUrl: string, duration?: string) => void;
  onRefreshCatalog: () => void;
}

interface SavedMediaAsset {
  id: string;
  name: string;
  url: string;
  type: 'banner' | 'cover';
  aspectRatio: '16:9' | '1:1';
  uploadedAt: string;
}

const STORAGE_MEDIA_ASSETS_KEY = 'habajaba_media_library_v1';

export const MediaManagementSection: React.FC<MediaManagementSectionProps> = ({
  tracks,
  onOpenSongFormWithAudio,
  onRefreshCatalog,
}) => {
  // 1. Hero Banner State
  const [banner, setBanner] = useState<HeroBannerConfig>(() => MusicService.getHeroBanner());
  const [bannerSavedAlert, setBannerSavedAlert] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);

  // 2. Dropbox Audio Ingestion & Live Test State
  const [dropboxInputUrl, setDropboxInputUrl] = useState('');
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<ReturnType<typeof analyzeAudioUrl> | null>(null);
  const [audioTestResult, setAudioTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    duration?: number;
  } | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // 3. Album Cover Upload & Library State
  const [coverInputUrl, setCoverInputUrl] = useState('');
  const [selectedTrackForCover, setSelectedTrackForCover] = useState<string>(tracks[0]?.id || '');
  const [coverSavedAlert, setCoverSavedAlert] = useState(false);
  const [coverAspectRatio, setCoverAspectRatio] = useState<'16:9' | '1:1'>('16:9');
  const [mediaAssets, setMediaAssets] = useState<SavedMediaAsset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MEDIA_ASSETS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'default-hero',
        name: 'Official 16:9 Studio Banner',
        url: '/banner-default.svg',
        type: 'banner',
        aspectRatio: '16:9',
        uploadedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: 'acoustic-stage',
        name: 'Acoustic Stage Live',
        url: '/banner-hero.svg',
        type: 'banner',
        aspectRatio: '16:9',
        uploadedAt: new Date().toISOString().split('T')[0],
      },
      {
        id: 'brand-logo',
        name: 'Official Brand Emblem',
        url: '/logo.svg',
        type: 'cover',
        aspectRatio: '1:1',
        uploadedAt: new Date().toISOString().split('T')[0],
      },
    ];
  });

  // Sync banner state when external catalog changes
  useEffect(() => {
    const unsub = MusicService.subscribe(() => {
      setBanner(MusicService.getHeroBanner());
    });
    return unsub;
  }, []);

  const saveMediaAssets = (assets: SavedMediaAsset[]) => {
    setMediaAssets(assets);
    try {
      localStorage.setItem(STORAGE_MEDIA_ASSETS_KEY, JSON.stringify(assets));
    } catch (e) {
      console.warn('Failed to save media assets:', e);
    }
  };

  // --- Hero Banner Handlers ---
  const handleSaveBanner = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    MusicService.saveHeroBanner(banner);
    setBannerSavedAlert(true);
    setTimeout(() => setBannerSavedAlert(false), 2500);
    onRefreshCatalog();
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBannerUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updated = { ...banner, bannerUrl: result };
        setBanner(updated);
        MusicService.saveHeroBanner(updated);
        onRefreshCatalog();

        // Add to saved assets
        const newAsset: SavedMediaAsset = {
          id: `asset-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: result,
          type: 'banner',
          aspectRatio: '16:9',
          uploadedAt: new Date().toISOString().split('T')[0],
        };
        saveMediaAssets([newAsset, ...mediaAssets.filter((a) => a.id !== newAsset.id)]);

        setBannerSavedAlert(true);
        setTimeout(() => setBannerSavedAlert(false), 2500);
      }
      setIsBannerUploading(false);
    };
    reader.onerror = () => {
      setIsBannerUploading(false);
      alert('ইমেজ ফাইল পড়তে সমস্যা হয়েছে (Error reading image file).');
    };
    reader.readAsDataURL(file);
  };

  // --- Dropbox Audio Ingestion Handlers ---
  const handleAnalyzeDropboxUrl = (url: string) => {
    setDropboxInputUrl(url);
    if (!url.trim()) {
      setAudioAnalysis(null);
      setAudioTestResult(null);
      setAudioPreviewUrl(null);
      return;
    }
    const analysis = analyzeAudioUrl(url.trim());
    setAudioAnalysis(analysis);
    setAudioTestResult(null);
    setAudioPreviewUrl(analysis.streamableUrl);
  };

  const handleTestDropboxAudio = async () => {
    if (!dropboxInputUrl.trim()) return;
    setIsTestingAudio(true);
    setAudioTestResult(null);

    const test = await testAudioStreamability(dropboxInputUrl.trim());
    setIsTestingAudio(false);
    setAudioTestResult({
      tested: true,
      success: test.success,
      message: test.message,
      duration: test.duration,
    });
    setAudioPreviewUrl(getDirectAudioUrl(dropboxInputUrl.trim()));
  };

  const togglePreviewPlay = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch((err) => {
        console.warn('Audio play error:', err);
      });
    }
  };

  // --- Album Cover Handlers ---
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCoverInputUrl(result);

        const newAsset: SavedMediaAsset = {
          id: `cover-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: result,
          type: 'cover',
          aspectRatio: coverAspectRatio,
          uploadedAt: new Date().toISOString().split('T')[0],
        };
        saveMediaAssets([newAsset, ...mediaAssets]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAssignCoverToTrack = () => {
    if (!selectedTrackForCover || !coverInputUrl.trim()) {
      alert('গান ও কভার ইমেজ উভয়ই সিলেক্ট করুন (Please select song and cover image).');
      return;
    }

    MusicService.updateTrackCover(selectedTrackForCover, coverInputUrl.trim());
    setCoverSavedAlert(true);
    setTimeout(() => setCoverSavedAlert(false), 2500);
    onRefreshCatalog();
  };

  const handleSetCoverAsBanner = () => {
    if (!coverInputUrl.trim()) return;
    const updated = { ...banner, bannerUrl: coverInputUrl.trim() };
    setBanner(updated);
    MusicService.saveHeroBanner(updated);
    setBannerSavedAlert(true);
    setTimeout(() => setBannerSavedAlert(false), 2500);
    onRefreshCatalog();
  };

  const handleDeleteAsset = (id: string) => {
    if (id === 'default-hero' || id === 'acoustic-stage' || id === 'brand-logo') {
      alert('সিস্টেম প্রিসেট মুছে ফেলা যাবে না (Cannot delete default presets).');
      return;
    }
    saveMediaAssets(mediaAssets.filter((a) => a.id !== id));
  };

  const formatSecs = (secs?: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Real-time sync status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-50 border border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ED1025]/10 text-[#ED1025] flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#171717]">
              Media Management &amp; Assets Hub (মিডিয়া ও ব্যানার হাব)
            </h3>
            <p className="text-xs text-[#6B7280] font-bengali">
              ড্রপবক্স অডিও লিঙ্ক, অ্যালবাম কভার ও ১৬:৯ ব্যানার রিয়েল-টাইমে পরিবর্তন করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Real-Time State Sync</span>
          </span>
        </div>
      </div>

      {/* SECTION 1: HERO BANNER MANAGEMENT */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EAEAEA] shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ED1025]/10 flex items-center justify-center text-[#ED1025]">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#171717]">
                ১. প্রধান ব্যানার পরিবর্তন (16:9 YouTube Aspect Ratio Hero Banner)
              </h2>
              <p className="text-[11px] text-[#6B7280] font-bengali">
                হোমপেজের প্রধান 16:9 ব্যানার ও শিরোনাম লাইভ আপডেট করুন
              </p>
            </div>
          </div>

          {bannerSavedAlert && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
              <Check className="w-4 h-4" /> ব্যানার লাইভ আপডেট হয়েছে!
            </span>
          )}
        </div>

        {/* 16:9 Real-Time Live Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#171717]">
              ব্যানার লাইভ প্রিভিউ (Exact 16:9 Aspect Ratio Preview):
            </span>
            <span className="text-[11px] text-[#6B7280]">
              হোমপেজে যেভাবে দেখাবে
            </span>
          </div>

          <div className="relative aspect-[16/9] w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-[#EAEAEA] bg-neutral-50 shadow-inner group">
            <img
              src={banner.bannerUrl || '/banner-default.svg'}
              alt="Live Banner Preview"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/banner-default.svg';
              }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />

            {/* Clean Live Overlay Preview */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-[#ED1025] text-[10px] font-bold shadow-xs">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>Habajaba LIVE</span>
            </div>

            <div className="absolute bottom-2.5 right-2.5">
              <span className="px-3 py-1 rounded-full bg-[#ED1025] text-white text-[10px] font-bold shadow-md shadow-[#ED1025]/30 flex items-center gap-1">
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Play Live</span>
              </span>
            </div>
          </div>
        </div>

        {/* Banner Controls & Form */}
        <form onSubmit={handleSaveBanner} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-[#171717] block mb-1">
                ব্যানারের শিরোনাম (Banner Title)
              </label>
              <input
                type="text"
                value={banner.title}
                onChange={(e) => {
                  const updated = { ...banner, title: e.target.value };
                  setBanner(updated);
                  MusicService.saveHeroBanner(updated);
                }}
                placeholder="Habajaba Studio LIVE"
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">
                ব্যানারের সাবটাইটেল (Subtitle)
              </label>
              <input
                type="text"
                value={banner.subtitle}
                onChange={(e) => {
                  const updated = { ...banner, subtitle: e.target.value };
                  setBanner(updated);
                  MusicService.saveHeroBanner(updated);
                }}
                placeholder="অরিজিনাল বাংলা গান · Original Bengali Music"
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-bold text-[#171717] block">
              ব্যানার ছবির ইউআরএল বা ফাইল আপলোড (Banner Image URL or File Upload)
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={banner.bannerUrl}
                onChange={(e) => {
                  const updated = { ...banner, bannerUrl: e.target.value };
                  setBanner(updated);
                  MusicService.saveHeroBanner(updated);
                }}
                placeholder="https://... or /banner-default.svg"
                className="flex-1 px-3 py-2 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden text-xs"
              />

              {/* Local File Upload Button */}
              <label className="min-h-[38px] px-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#171717] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5 text-[#ED1025]" />
                <span>{isBannerUploading ? 'Uploading...' : 'ডিভাইস থেকে ছবি আপলোড'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-[#6B7280] font-medium">প্রিসেট ব্যানার:</span>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...banner, bannerUrl: '/banner-default.svg' };
                  setBanner(updated);
                  MusicService.saveHeroBanner(updated);
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-[#ED1025]/10 hover:text-[#ED1025] text-[11px] font-semibold transition-colors"
              >
                ডিফল্ট স্টুডিও ব্যানার (Default 16:9)
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...banner, bannerUrl: '/banner-hero.svg' };
                  setBanner(updated);
                  MusicService.saveHeroBanner(updated);
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-[#ED1025]/10 hover:text-[#ED1025] text-[11px] font-semibold transition-colors"
              >
                অ্যাকোস্টিক স্টেজ ব্যানার (Acoustic Stage)
              </button>
            </div>
          </div>

          {/* Featured Song Link Selector */}
          {tracks.length > 0 && (
            <div className="text-xs">
              <label className="font-bold text-[#171717] block mb-1">
                ব্যানার প্লে বাটনে কোন গান যুক্ত করবেন (Featured Play Track)
              </label>
              <select
                value={banner.featuredTrackId || ''}
                onChange={(e) => {
                  const updated = { ...banner, featuredTrackId: e.target.value };
                  setBanner(updated);
                  MusicService.saveHeroBanner(updated);
                }}
                className="w-full sm:w-80 px-3 py-2 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden bg-white text-xs"
              >
                <option value="">প্রথম প্রকাশিত গান (Default First Track)</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} — {t.artist}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>ওয়েবসাইটে প্রয়োগ করুন (Apply Live Banner)</span>
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 2: DROPBOX AUDIO INGESTION & LIVE STREAM TESTER */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EAEAEA] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Link className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#171717]">
                ২. ড্রপবক্স অডিও লিঙ্ক যাচাই ও রূপান্তর (Dropbox Audio Link Ingestion)
              </h2>
              <p className="text-[11px] text-[#6B7280] font-bengali">
                ড্রপবক্সের যেকোনো শেয়ার লিঙ্ক দিলে তা স্বয়ংক্রিয়ভাবে ডাইরেক্ট অডিও স্ট্রিমে রূপান্তর হবে
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-[#171717] block mb-1">
              ড্রপবক্স শেয়ার লিঙ্ক পেস্ট করুন (Paste Dropbox Share URL)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={dropboxInputUrl}
                onChange={(e) => handleAnalyzeDropboxUrl(e.target.value)}
                placeholder="https://www.dropbox.com/s/xyz123/song.mp3?dl=0"
                className="flex-1 px-3 py-2.5 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden text-xs"
              />
              <button
                type="button"
                onClick={handleTestDropboxAudio}
                disabled={!dropboxInputUrl.trim() || isTestingAudio}
                className="min-h-[38px] px-4 rounded-xl bg-[#171717] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                {isTestingAudio ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ED1025]" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-[#ED1025] fill-current" />
                )}
                <span>{isTestingAudio ? 'টেস্ট হচ্ছে...' : 'অডিও টেস্ট করুন (Test Audio)'}</span>
              </button>
            </div>
          </div>

          {/* Analysis Result Card */}
          {audioAnalysis && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-[#EAEAEA] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#171717] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>রূপান্তরিত ডাইরেক্ট অডিও লিঙ্ক (Direct Streaming CDN URL):</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold uppercase">
                  {audioAnalysis.isDropbox ? 'Dropbox Direct' : 'Web Stream'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-[#EAEAEA] font-mono text-[11px] text-neutral-800 break-all select-all flex items-center justify-between gap-2">
                <span className="truncate">{audioAnalysis.streamableUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(audioAnalysis.streamableUrl);
                    alert('ডাইরেক্ট লিঙ্ক কপি হয়েছে! (Copied to clipboard)');
                  }}
                  className="p-1 hover:bg-neutral-100 rounded text-neutral-600 shrink-0"
                  title="Copy direct stream URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Live Audio Test Status */}
              {audioTestResult && (
                <div
                  className={`p-3 rounded-xl flex items-center justify-between text-xs font-medium ${
                    audioTestResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {audioTestResult.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{audioTestResult.message}</span>
                  </div>

                  {audioTestResult.duration && (
                    <span className="font-bold text-xs bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                      দৈর্ঘ্য: {formatSecs(audioTestResult.duration)}
                    </span>
                  )}
                </div>
              )}

              {/* Audio Preview Element */}
              {audioPreviewUrl && (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#EAEAEA]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePreviewPlay}
                      className="w-8 h-8 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white flex items-center justify-center shadow-xs transition-colors"
                      title={isPlayingPreview ? 'Pause' : 'Play Preview'}
                    >
                      {isPlayingPreview ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                      )}
                    </button>
                    <span className="text-xs font-semibold text-[#171717]">
                      {isPlayingPreview ? 'অডিও বাজছে (Playing Preview)...' : 'অডিও প্রিভিউ প্লে করুন'}
                    </span>
                    <audio
                      ref={audioPreviewRef}
                      src={audioPreviewUrl}
                      onEnded={() => setIsPlayingPreview(false)}
                      onError={() => setIsPlayingPreview(false)}
                      className="hidden"
                    />
                  </div>

                  {/* Transfer to Song Form CTA */}
                  {onOpenSongFormWithAudio && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenSongFormWithAudio(
                          audioAnalysis.streamableUrl,
                          audioTestResult?.duration ? formatSecs(audioTestResult.duration) : undefined
                        )
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Music2 className="w-3.5 h-3.5" />
                      <span>এই অডিও দিয়ে নতুন গান যুক্ত করুন (Add Song with URL)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: ALBUM COVER UPLOAD & ASSET LIBRARY */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EAEAEA] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#171717]">
                ৩. অ্যালবাম কভার ও ইমেজ আপলোড (Album Cover &amp; Asset Library)
              </h2>
              <p className="text-[11px] text-[#6B7280] font-bengali">
                গান ও অ্যালবামের কভার আপলোড করুন এবং যেকোনো গানে সংযুক্ত করুন
              </p>
            </div>
          </div>

          {coverSavedAlert && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
              <Check className="w-4 h-4" /> কভার সফলভাবে যুক্ত হয়েছে!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Left: Upload & Assign Form */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-[#171717] block mb-1">
                কভার ইমেজ আপলোড বা ইউআরএল (Cover Upload or URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coverInputUrl}
                  onChange={(e) => setCoverInputUrl(e.target.value)}
                  placeholder="https://... or choose file below"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden text-xs"
                />
                <label className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#171717] font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5 text-[#ED1025]" />
                  <span>আপলোড</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Aspect Ratio Toggle */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#171717]">রেশিও:</span>
              <button
                type="button"
                onClick={() => setCoverAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  coverAspectRatio === '16:9'
                    ? 'bg-[#ED1025] text-white'
                    : 'bg-neutral-100 text-[#171717]'
                }`}
              >
                16:9 (ইউটিউব ফরম্যাট)
              </button>
              <button
                type="button"
                onClick={() => setCoverAspectRatio('1:1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  coverAspectRatio === '1:1'
                    ? 'bg-[#ED1025] text-white'
                    : 'bg-neutral-100 text-[#171717]'
                }`}
              >
                1:1 (স্কয়ার অ্যালবাম)
              </button>
            </div>

            {/* Target Song Selection */}
            {tracks.length > 0 && (
              <div>
                <label className="font-bold text-[#171717] block mb-1">
                  কোন গানে এই কভারটি যুক্ত করতে চান (Assign to Track)
                </label>
                <select
                  value={selectedTrackForCover}
                  onChange={(e) => setSelectedTrackForCover(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden bg-white text-xs"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} — {t.artist}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleAssignCoverToTrack}
                disabled={!coverInputUrl.trim() || tracks.length === 0}
                className="px-4 py-2 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>নির্বাচিত গানে যুক্ত করুন (Assign to Song)</span>
              </button>

              <button
                type="button"
                onClick={handleSetCoverAsBanner}
                disabled={!coverInputUrl.trim()}
                className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 text-[#171717] font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#ED1025]" />
                <span>প্রধান ব্যানার হিসেবে সেট করুন</span>
              </button>
            </div>
          </div>

          {/* Right: Cover Live Preview */}
          <div className="space-y-1.5 flex flex-col justify-center">
            <span className="font-bold text-[#171717] block">
              কভার প্রিভিউ ({coverAspectRatio}):
            </span>
            <div
              className={`w-full max-w-xs mx-auto rounded-2xl overflow-hidden border border-[#EAEAEA] bg-neutral-100 relative shadow-inner flex items-center justify-center ${
                coverAspectRatio === '16:9' ? 'aspect-video' : 'aspect-square'
              }`}
            >
              {coverInputUrl ? (
                <img
                  src={coverInputUrl}
                  alt="Cover Preview"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/banner-default.svg';
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-4 text-center text-[#6B7280]">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <span>কোন কভার সিলেক্ট করা নেই</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Media Asset Library Gallery */}
        <div className="pt-4 border-t border-[#EAEAEA] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#171717]">
              সংরক্ষিত মিডিয়া গ্যালারি (Saved Asset Library):
            </span>
            <span className="text-[11px] text-[#6B7280]">
              যেকোনো কভারে ক্লিক করে ব্যবহার করুন
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mediaAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => {
                  setCoverInputUrl(asset.url);
                  setCoverAspectRatio(asset.aspectRatio);
                }}
                className="group relative rounded-xl border border-[#EAEAEA] bg-neutral-50 overflow-hidden cursor-pointer hover:border-[#ED1025] hover:shadow-xs transition-all"
              >
                <div className="aspect-video w-full bg-neutral-100 overflow-hidden">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/banner-default.svg';
                    }}
                  />
                </div>
                <div className="p-2 flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold text-[#171717] truncate">
                    {asset.name}
                  </span>
                  {asset.id !== 'default-hero' && asset.id !== 'acoustic-stage' && asset.id !== 'brand-logo' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAsset(asset.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
