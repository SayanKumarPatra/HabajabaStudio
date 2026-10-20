import React, { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sliders,
  Link as LinkIcon,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { BannerSlide } from '../types/music';
import { MusicService, defaultSlidingBanners } from '../services/musicService';
import { uploadImageToCloud } from '../services/cloudStorageService';
import { getDirectAudioUrl } from '../utils/dropbox';

export const SlidingBannersAdminSection: React.FC = () => {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savedAlert, setSavedAlert] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    setBanners(MusicService.getSlidingBanners());
    const unsub = MusicService.subscribe(() => {
      setBanners(MusicService.getSlidingBanners());
    });
    return unsub;
  }, []);

  const handleBannerUpload = async (index: number, file: File) => {
    setUploadingIndex(index);

    try {
      // 1. Instant local preview
      const instantPreviewUrl = URL.createObjectURL(file);
      const preliminary = [...banners];
      preliminary[index] = {
        ...preliminary[index],
        imageUrl: instantPreviewUrl,
      };
      setBanners(preliminary);

      // 2. High-speed lightweight 16:9 compression (960x540 at 0.68 quality = ~35KB)
      const result = await uploadImageToCloud(file, 'banners', {
        maxWidth: 960,
        maxHeight: 540,
        quality: 0.68,
        format: 'image/jpeg',
      });

      const updated = [...banners];
      updated[index] = {
        ...updated[index],
        imageUrl: result.url,
      };

      setBanners(updated);
      await MusicService.saveSlidingBanners(updated);

      setSavedAlert({
        show: true,
        message: `ব্যানার #${index + 1} সফলভাবে লাইভ সার্ভারে সেভ হয়েছে!`,
        type: 'success',
      });
      setTimeout(() => setSavedAlert({ show: false, message: '', type: 'success' }), 3500);
    } catch (err) {
      console.error('Banner upload failed:', err);
      alert('ব্যানার আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleUrlChange = (index: number, url: string) => {
    let formatted = url.trim();
    if (formatted.includes('dropbox.com')) {
      formatted = getDirectAudioUrl(formatted);
    }

    const updated = [...banners];
    updated[index] = {
      ...updated[index],
      imageUrl: formatted || '/banner-default.svg',
    };
    setBanners(updated);
  };

  const handleTitleChange = (index: number, title: string) => {
    const updated = [...banners];
    updated[index] = {
      ...updated[index],
      title,
    };
    setBanners(updated);
  };

  const handleSubtitleChange = (index: number, subtitle: string) => {
    const updated = [...banners];
    updated[index] = {
      ...updated[index],
      subtitle,
    };
    setBanners(updated);
  };

  const handleAddNewBanner = async () => {
    const newSlide: BannerSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      imageUrl: '/banner-default.svg',
      title: `Banner ${banners.length + 1}`,
      subtitle: 'Habajaba Studio LIVE',
    };
    const updated = [...banners, newSlide];
    setBanners(updated);
    await MusicService.saveSlidingBanners(updated);
    setSavedAlert({
      show: true,
      message: `নতুন ব্যানার #${updated.length} যোগ করা হয়েছে! ছবি ও তথ্য দিন।`,
      type: 'success',
    });
    setTimeout(() => setSavedAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleDeleteBanner = async (index: number) => {
    if (banners.length <= 1) {
      alert('কমপক্ষে ১টি ব্যানার থাকা আবশ্যক!');
      return;
    }
    const updated = banners.filter((_, idx) => idx !== index);
    setBanners(updated);
    await MusicService.saveSlidingBanners(updated);
    setSavedAlert({
      show: true,
      message: `ব্যানার #${index + 1} সফলভাবে মুছে ফেলা হয়েছে!`,
      type: 'info',
    });
    setTimeout(() => setSavedAlert({ show: false, message: '', type: 'info' }), 3000);
  };

  const handleMoveBanner = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setBanners(updated);
    await MusicService.saveSlidingBanners(updated);
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      await MusicService.saveSlidingBanners(banners);
      setSavedAlert({
        show: true,
        message: `সকল ${banners.length} টি ব্যানার সফলভাবে ক্লাউড ও লাইভ সার্ভারে সংরক্ষণ করা হয়েছে!`,
        type: 'success',
      });
      setTimeout(() => setSavedAlert({ show: false, message: '', type: 'success' }), 3500);
    } catch (err) {
      console.error('Failed to save banners:', err);
      alert('ব্যানার সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (confirm('ব্যানারগুলো কি ডিফল্ট ৪টিতে ফিরিয়ে নিতে চান?')) {
      setBanners(defaultSlidingBanners);
      await MusicService.saveSlidingBanners(defaultSlidingBanners);
      setSavedAlert({
        show: true,
        message: 'ডিফল্ট ব্যানারগুলো সক্রিয় করা হয়েছে।',
        type: 'info',
      });
      setTimeout(() => setSavedAlert({ show: false, message: '', type: 'info' }), 3000);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-xl space-y-5 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ED1025]/20 text-[#ED1025] flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>হোমপেজ স্লাইডিং ব্যানার (মোট {banners.length} টি)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                লাইভ সিঙ্ক
              </span>
            </h3>
            <p className="text-xs text-neutral-400 font-bengali">
              ইচ্ছেমত যত খুশি ব্যানার যোগ করুন, সাজান এবং হোমপেজে স্ক্রোল বা স্লাইড আকারে প্রদর্শন করুন।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddNewBanner}
            className="px-3.5 py-1.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#ED1025]/30 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন ব্যানার যোগ করুন</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ডিফল্ট</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingAll ? 'সেভ হচ্ছে...' : 'সব সেভ করুন'}</span>
          </button>
        </div>
      </div>

      {savedAlert.show && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedAlert.message}</span>
        </div>
      )}

      {/* Dynamic Grid of Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((slide, slotIndex) => {
          const isSlotUploading = uploadingIndex === slotIndex;

          return (
            <div
              key={slide.id || slotIndex}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 flex flex-col justify-between hover:border-white/20 transition-all group"
            >
              {/* Header with Ordering and Delete controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#ED1025] text-white text-xs font-mono flex items-center justify-center font-bold">
                    {slotIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-white">ব্যানার #{slotIndex + 1}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={slotIndex === 0}
                    onClick={() => handleMoveBanner(slotIndex, 'up')}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={slotIndex === banners.length - 1}
                    onClick={() => handleMoveBanner(slotIndex, 'down')}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(slotIndex)}
                    className="w-7 h-7 rounded-lg bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 16:9 Image Preview - Borderless */}
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-neutral-900 border-0 border-none flex items-center justify-center shadow-inner">
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt={slide.title || `Banner ${slotIndex + 1}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/banner-default.svg';
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-500 text-xs">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span>কোনো ছবি নেই</span>
                  </div>
                )}

                {isSlotUploading && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-medium gap-1.5">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#ED1025]" />
                    <span>আপলোড ও সিঙ্ক হচ্ছে...</span>
                  </div>
                )}
              </div>

              {/* Controls: Title, Subtitle, URL & File Upload */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={slide.title || ''}
                    onChange={(e) => handleTitleChange(slotIndex, e.target.value)}
                    placeholder="ব্যানার টাইটেল"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-xs focus:border-[#ED1025] focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={slide.subtitle || ''}
                    onChange={(e) => handleSubtitleChange(slotIndex, e.target.value)}
                    placeholder="সাব-টাইটেল"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-xs focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={slide.imageUrl || ''}
                    onChange={(e) => handleUrlChange(slotIndex, e.target.value)}
                    placeholder="ইমেজ লিঙ্ক (Dropbox / Direct URL)"
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>

                <label className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-[#ED1025] text-white border border-white/15 hover:border-[#ED1025] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {isSlotUploading ? 'প্রসেস হচ্ছে...' : 'ডিভাইস থেকে ছবি আপলোড'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSlotUploading}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBannerUpload(slotIndex, file);
                      if (e.target) e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Add Banner Shortcut */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleAddNewBanner}
          className="px-5 py-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#ED1025] hover:bg-[#ED1025]/10 text-neutral-300 hover:text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 text-[#ED1025]" />
          <span>আরেকটি ব্যানার যোগ করুন (+ Add Another Banner)</span>
        </button>
      </div>
    </div>
  );
};
