import React, { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sliders,
  Cloud,
  Link as LinkIcon,
  Save,
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
        id: `slide-${index + 1}`,
        imageUrl: instantPreviewUrl,
        title: `Banner ${index + 1}`,
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
        id: `slide-${index + 1}`,
        imageUrl: result.url,
        title: `Banner ${index + 1}`,
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
    // If Dropbox link, automatically convert to direct content URL
    let formatted = url.trim();
    if (formatted.includes('dropbox.com')) {
      formatted = getDirectAudioUrl(formatted);
    }

    const updated = [...banners];
    updated[index] = {
      id: `slide-${index + 1}`,
      imageUrl: formatted || '/banner-default.svg',
      title: `Banner ${index + 1}`,
    };
    setBanners(updated);
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      await MusicService.saveSlidingBanners(banners);
      setSavedAlert({
        show: true,
        message: '৪টি ব্যানার সফলভাবে ক্লাউড ও লাইভ সার্ভারে সংরক্ষণ করা হয়েছে!',
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
    if (confirm('৪টি ব্যানার ডিফল্টে ফিরিয়ে নিতে চান?')) {
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

  const slots = [0, 1, 2, 3];

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl space-y-5 text-white">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ED1025]/20 text-[#ED1025] flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>হোমপেজ ৪টি স্লাইডিং ব্যানার (16:9 Widescreen)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                লাইভ সিঙ্ক
              </span>
            </h3>
            <p className="text-xs text-neutral-400 font-bengali">
              ছবি আপলোড করুন বা লিংক পেস্ট করুন। হোমপেজে স্বয়ংক্রিয়ভাবে স্লাইড করবে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ডিফল্ট ব্যানার</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className="px-4 py-1.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#ED1025]/30 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingAll ? 'সেভ হচ্ছে...' : 'লাইভ সার্ভারে সেভ করুন'}</span>
          </button>
        </div>
      </div>

      {savedAlert.show && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedAlert.message}</span>
        </div>
      )}

      {/* Grid of 4 Banner Slots — Clean, Minimal, Functional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {slots.map((slotIndex) => {
          const currentSlide = banners[slotIndex];
          const isSlotUploading = uploadingIndex === slotIndex;

          return (
            <div
              key={slotIndex}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 flex flex-col justify-between hover:border-white/20 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#ED1025] text-white text-[11px] font-mono flex items-center justify-center font-bold">
                    {slotIndex + 1}
                  </span>
                  <span>ব্যানার স্লট #{slotIndex + 1}</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">১৬:৯ অনুপাত</span>
              </div>

              {/* 16:9 Image Preview */}
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center shadow-inner">
                {currentSlide?.imageUrl ? (
                  <img
                    src={currentSlide.imageUrl}
                    alt={`Banner ${slotIndex + 1}`}
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

              {/* Controls: Direct URL Input & Upload Button */}
              <div className="space-y-2">
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={currentSlide?.imageUrl || ''}
                    onChange={(e) => handleUrlChange(slotIndex, e.target.value)}
                    placeholder="ইমেজ লিঙ্ক পেস্ট করুন (Dropbox/Direct URL)"
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
    </div>
  );
};
