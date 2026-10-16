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
  Image as ImageIcon,
  Cloud,
  Palette,
  HelpCircle,
} from 'lucide-react';
import { HeroBannerConfig, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { analyzeAudioUrl, testAudioStreamability } from '../utils/dropbox';
import { useAudio } from '../context/AudioContext';
import { CoverImage } from '../components/CoverImage';
import { MediaManagementSection } from '../components/MediaManagementSection';
import { BrandingAdminSection } from '../components/BrandingAdminSection';
import { FirebaseAdminSection } from '../components/FirebaseAdminSection';
import { optimizeImageFile } from '../utils/imageOptimizer';

interface AdminPageProps {
  onOpenDropboxGuide?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onOpenDropboxGuide }) => {
  const { playTrack, isPlaying, currentTrack, togglePlay } = useAudio();

  const [adminTab, setAdminTab] = useState<'media' | 'songs' | 'branding' | 'firebase'>('media');

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
    try {
      // Compress and optimize to 16:9 HD resolution (960x540 max, ~50KB)
      const optimized = await optimizeImageFile(file, 960, 540, 0.84, 'image/jpeg');
      setCoverUrl(optimized);
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

  return (
    <div className="space-y-8 pb-10">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEAEA]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#ED1025] text-white">
              ADMIN CONTROL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171717]">
              এডমিন প্যানেল (Music &amp; Banner Manager)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium font-bengali">
            গান আপলোড, ড্রপবক্স লিঙ্ক যাচাই, ব্যানার পরিবর্তন ও প্রকাশনা নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDropboxGuide && (
            <button
              onClick={onOpenDropboxGuide}
              className="min-h-[44px] px-3.5 rounded-xl border border-[#EAEAEA] bg-white hover:bg-neutral-50 text-xs font-semibold text-[#171717] flex items-center gap-1.5 transition-colors"
              title="Open Dropbox Streaming Helper & Guide"
            >
              <HelpCircle className="w-4 h-4 text-[#ED1025]" />
              <span>Dropbox Guide</span>
            </button>
          )}

          <button
            onClick={handleExportJson}
            className="min-h-[44px] px-3.5 rounded-xl border border-[#EAEAEA] bg-white hover:bg-neutral-50 text-xs font-semibold text-[#171717] flex items-center gap-1.5 transition-colors"
            title="Export updated catalog for Vercel deployment"
          >
            <FileJson className="w-4 h-4 text-[#ED1025]" />
            <span>Export music.json</span>
          </button>

          <button
            onClick={handleOpenAddForm}
            className="min-h-[44px] px-4 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন গান যোগ করুন (Add Song)</span>
          </button>
        </div>
      </div>

      {/* Real-time Cloud Status Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          MusicService.isFirebaseLive()
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${
              MusicService.isFirebaseLive() ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>
                {MusicService.isFirebaseLive()
                  ? '🟢 ফায়ারবেস ক্লাউড লাইভ সক্রিয় (Real-time Live Active)'
                  : '🟡 লোকাল মোড (গান এই ডিভাইসে সংরক্ষিত)'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 font-bengali mt-0.5">
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
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
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
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              লাইভ ক্লাউডে সিঙ্ক করুন ({tracks.length} Tracks)
            </button>
          )}
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#EAEAEA] pb-3">
        <button
          onClick={() => setAdminTab('media')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'media'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-neutral-100 text-[#171717] hover:bg-neutral-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>মিডিয়া ও ব্যানার হাব (Media &amp; Banner Hub)</span>
        </button>

        <button
          onClick={() => setAdminTab('songs')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'songs'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-neutral-100 text-[#171717] hover:bg-neutral-200'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>গান তালিকা ও আপলোড ({tracks.length} Tracks)</span>
        </button>

        <button
          onClick={() => setAdminTab('branding')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'branding'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-neutral-100 text-[#171717] hover:bg-neutral-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>লোগো ও ব্র্যান্ডিং (Logo &amp; Branding)</span>
        </button>

        <button
          onClick={() => setAdminTab('firebase')}
          className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'firebase'
              ? 'bg-[#ED1025] text-white shadow-xs'
              : 'bg-neutral-100 text-[#171717] hover:bg-neutral-200'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>ফায়ারবেস ক্লাউড লাইভ (Firebase Live Server)</span>
        </button>
      </div>

      {/* Tab 1: Media & Assets Management Hub */}
      {adminTab === 'media' && (
        <MediaManagementSection
          tracks={tracks}
          onOpenSongFormWithAudio={handleOpenAddFormWithAudio}
          onRefreshCatalog={refreshCatalog}
        />
      )}

      {/* Tab 2: Song Management List */}
      {adminTab === 'songs' && (
        <section className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#171717] flex items-center gap-2">
              <Music className="w-4 h-4 text-[#ED1025]" />
              <span>গানসমূহ ({tracks.length} টি গান)</span>
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              ড্রপবক্সের লিঙ্কের মাধ্যমে পরিচালিত গানসমূহ। টাচ বা ক্লিক করলে তাৎক্ষণিক চলবে।
            </p>
          </div>

          {tracks.length === 0 && (
            <button
              onClick={handleAddSampleTrack}
              className="text-xs text-[#ED1025] hover:underline font-semibold"
            >
              + Add Sample Track to Test
            </button>
          )}
        </div>

        {tracks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-[#6B7280] uppercase tracking-wider text-[10px] border-b border-[#EAEAEA]">
                <tr>
                  <th className="py-3 px-3">16:9 ব্যানার</th>
                  <th className="py-3 px-3">গানের শিরোনাম ও শিল্পী</th>
                  <th className="py-3 px-3">জঁর / অ্যালবাম</th>
                  <th className="py-3 px-3">সময়</th>
                  <th className="py-3 px-3">স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {tracks.map((t) => {
                  const isCurrent = currentTrack?.id === t.id && isPlaying;
                  return (
                    <tr key={t.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* 16:9 YouTube Ratio Thumbnail */}
                      <td className="py-3 px-3">
                        <div className="w-24 aspect-video rounded-lg overflow-hidden border border-[#EAEAEA] bg-neutral-100 relative">
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
                        <div className="font-bold text-[#171717] text-sm">{t.title}</div>
                        <div className="text-[11px] text-[#6B7280]">{t.artist}</div>
                      </td>

                      {/* Genre & Album */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#171717]">{t.genre}</div>
                        <div className="text-[11px] text-[#6B7280]">{t.album || '—'}</div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 font-mono text-[#6B7280]">
                        {t.duration || '--:--'}
                      </td>

                      {/* Published Toggle */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleTogglePublish(t.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors ${
                            t.published
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
                            className="w-8 h-8 rounded-full bg-[#ED1025]/10 hover:bg-[#ED1025] hover:text-white text-[#ED1025] flex items-center justify-center transition-colors"
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
                            className="w-8 h-8 rounded-full hover:bg-neutral-200 text-[#171717] flex items-center justify-center transition-colors"
                            title="Edit Track"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteTrack(t.id, t.title)}
                            className="w-8 h-8 rounded-full hover:bg-red-50 text-red-600 flex items-center justify-center transition-colors"
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
          <div className="p-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-[#EAEAEA] space-y-3">
            <Music className="w-10 h-10 text-[#6B7280] mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-[#171717]">
              কোনো গান আপলোড করা নেই (No Songs Added Yet)
            </h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto">
              আপনার ড্রপবক্সের শেয়ার করা লিঙ্ক দিয়ে আপনার প্রথম গানটি এখনই যুক্ত করুন।
            </p>
            <button
              onClick={handleOpenAddForm}
              className="px-5 py-2.5 rounded-full bg-[#ED1025] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs"
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#EAEAEA] space-y-4 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <h3 className="text-base font-bold text-[#171717]">
                {editingTrackId ? 'গান সম্পাদনা করুন (Edit Track)' : 'নতুন গান যোগ করুন (Add New Song)'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#6B7280]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrack} className="space-y-4 text-xs">
              {/* Title & Artist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#171717] block mb-1">
                    গানের শিরোনাম (Song Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. মেঘের ডাক (Megher Daak)"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#171717] block mb-1">
                    শিল্পী (Artist) *
                  </label>
                  <input
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. Habajaba Studio LIVE ft. Sayan"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Album & Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#171717] block mb-1">
                    অ্যালবাম (Album Name - Optional)
                  </label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="e.g. Monsoon Sessions Vol. 1"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#171717] block mb-1">
                    জঁর (Genre)
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden bg-white"
                  >
                    <option value="Acoustic Live">Acoustic Live (অ্যাকোস্টিক লাইভ)</option>
                    <option value="Romantic">Romantic (রোমান্টিক)</option>
                    <option value="Folk Fusion">Folk Fusion (ফোক ফিউশন)</option>
                    <option value="Rabindra Sangeet">Rabindra Sangeet (রবীন্দ্র সঙ্গীত)</option>
                    <option value="Indie Bengali">Indie Bengali (ইন্ডি বাংলা)</option>
                    <option value="Classical">Classical (শাস্ত্রীয়)</option>
                  </select>
                </div>
              </div>

              {/* 16:9 YouTube Ratio Banner / Cover Upload */}
              <div className="space-y-2.5">
                <label className="font-bold text-[#171717] block">
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
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-[11px] font-semibold text-[#171717] whitespace-nowrap transition-colors"
                  >
                    Use Default Banner
                  </button>
                </div>

                {/* Direct link input as secondary option */}
                <div className="pt-1">
                  <div className="text-[11px] text-[#6B7280] mb-1">অথবা সরাসরি ইমেজ লিঙ্ক (Optional Image URL):</div>
                  <input
                    type="text"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://... or /banner-default.svg"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAEAEA] text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                {/* 16:9 thumbnail preview */}
                <div className="p-3 bg-neutral-50 rounded-2xl border border-[#EAEAEA] flex items-center gap-3">
                  <div className="w-36 aspect-video rounded-xl overflow-hidden border border-[#EAEAEA] bg-neutral-200 shrink-0 shadow-xs relative">
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
                  <div className="text-xs text-[#6B7280] space-y-1">
                    <p className="font-bold text-[#171717]">
                      {coverUrl && coverUrl.startsWith('data:') ? '✅ ডিভাইস ফাইল সফলভাবে যুক্ত হয়েছে' : '১৬:৯ ইউটিউব প্রিভিউ'}
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      মোবাইলে এবং প্লেলিস্টে গানটি ১৬:৯ অনুপাতে ডিসপ্লে হবে। গান সেভ করলে এটি স্বয়ংক্রিয়ভাবে ক্লাউডে আপলোড হয়ে যাবে।
                    </p>
                  </div>
                </div>
              </div>

              {/* Dropbox Audio URL & Live Stream Test */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-[#EAEAEA] space-y-2.5">
                <label className="font-bold text-[#171717] block">
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
                    className="flex-1 px-3 py-2.5 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleTestAudio}
                    disabled={isTestingAudio || !audioUrl.trim()}
                    className="px-4 py-2.5 bg-[#ED1025] hover:bg-[#D90D20] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isTestingAudio ? 'টেস্ট চলছে...' : 'টেস্ট প্লে (Test)'}</span>
                  </button>
                </div>

                {audioTestResult && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                      audioTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    {audioTestResult.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
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
                  <label className="font-bold text-[#171717]">সময়কাল (Duration):</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="03:45"
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-[#EAEAEA] text-center font-mono"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#171717]">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="w-4 h-4 accent-[#ED1025]"
                    />
                    <span>পাবলিক প্রকাশ (Published)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#171717]">
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
              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 font-semibold text-[#6B7280] hover:text-[#171717]"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold shadow-xs transition-colors"
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#EAEAEA] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
              <h3 className="text-base font-bold text-[#171717]">
                music.json এক্সপোর্ট করুন (Export for Vercel/GitHub)
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-[#6B7280] hover:text-[#171717]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6B7280]">
              আপনি ব্রাউজারে যে পরিবর্তনগুলো করেছেন, তা স্থায়ীভাবে Vercel কোডে সেভ করতে নিচের JSON টি কপি করে <code className="bg-neutral-100 px-1 py-0.5 rounded text-[#171717]">src/data/music.json</code> ফাইলে পেস্ট করে ডিপ্লয় করতে পারেন।
            </p>

            <textarea
              readOnly
              value={exportJson}
              rows={12}
              className="w-full text-[11px] font-mono p-3 bg-neutral-900 text-neutral-100 rounded-xl border border-neutral-800 resize-none focus:outline-hidden"
            />

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-[#6B7280]">
                {copied ? 'ক্লিপবোর্ডে কপি সম্পন্ন!' : 'কপি বাটনে ক্লিক করুন'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-4 py-2 bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#171717] font-semibold text-xs rounded-xl"
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
