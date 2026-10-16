import React, { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sparkles,
  Cloud,
  Sliders,
  Trash2,
} from 'lucide-react';
import { BannerSlide } from '../types/music';
import { MusicService, defaultSlidingBanners } from '../services/musicService';
import { uploadImageToCloud } from '../services/cloudStorageService';

export const SlidingBannersAdminSection: React.FC = () => {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<Record<number, string>>({});
  const [savedAlert, setSavedAlert] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
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
    setUploadStatus((prev) => ({
      ...prev,
      [index]: 'ইমেজ অপ্টিমাইজ ও ক্লাউড স্টোরেজে আপলোড হচ্ছে...',
    }));

    try {
      // 16:9 widescreen format optimization
      const result = await uploadImageToCloud(file, 'banners', {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.9,
      });

      const updated = [...banners];
      if (!updated[index]) {
        updated[index] = {
          id: `slide-${index + 1}`,
          imageUrl: result.url,
          title: `Habajaba Studio Banner ${index + 1}`,
        };
      } else {
        updated[index] = {
          ...updated[index],
          imageUrl: result.url,
        };
      }

      setBanners(updated);
      await MusicService.saveSlidingBanners(updated);

      setUploadStatus((prev) => ({
        ...prev,
        [index]: result.isCloudStorage
          ? 'Firebase Cloud Storage-এ আপলোড সম্পন্ন!'
          : 'লোকাল অপ্টিমাইজড সেভ সম্পন্ন!',
      }));

      setSavedAlert({
        show: true,
        message: `ব্যানার #${index + 1} সফলভাবে ক্লাউড স্টোরেজে সেভ ও লাইভ আপডেট হয়েছে!`,
      });
      setTimeout(() => setSavedAlert({ show: false, message: '' }), 4000);
    } catch (err) {
      console.error('Banner upload failed:', err);
      alert('ব্যানার আপলোড করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleResetToDefaults = async () => {
    if (confirm('আপনি কি ৪টি ডিফল্ট স্টুডিও ব্যানারে ফিরে যেতে চান?')) {
      setBanners(defaultSlidingBanners);
      await MusicService.saveSlidingBanners(defaultSlidingBanners);
      setSavedAlert({
        show: true,
        message: 'ডিফল্ট ৪টি ব্যানার পুনরায় সক্রিয় করা হয়েছে।',
      });
      setTimeout(() => setSavedAlert({ show: false, message: '' }), 3000);
    }
  };

  // Ensure array has 4 items
  const slots = [0, 1, 2, 3];

  return (
    <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#171717] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#ED1025]" />
            <span>হোমপেজ ৪টি স্লাইডিং ব্যানার ম্যানেজার (Sliding 16:9 Banners)</span>
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 font-bengali">
            এখানে আপনার পছন্দের ৪টি ব্যানার ছবি সরাসরি আপলোড করুন। হোমপেজে কোনো টেক্সট বা প্লে বাটন ছাড়া নিখুঁত ১৬:৯ রেশিওতে ব্যানারগুলো স্লাইড করবে।
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefaults}
          className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-600 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>ডিফল্ট ব্যানারে ফিরুন</span>
        </button>
      </div>

      {savedAlert.show && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedAlert.message}</span>
        </div>
      )}

      {/* Grid of 4 Banner Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {slots.map((slotIndex) => {
          const currentSlide = banners[slotIndex];
          const isSlotUploading = uploadingIndex === slotIndex;
          const statusText = uploadStatus[slotIndex];

          return (
            <div
              key={slotIndex}
              className="p-4 rounded-2xl bg-neutral-50 border border-[#EAEAEA] space-y-3 flex flex-col justify-between"
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#ED1025] text-white text-[11px] font-mono flex items-center justify-center">
                    {slotIndex + 1}
                  </span>
                  <span>স্লাইডিং ব্যানার স্লট #{slotIndex + 1}</span>
                </span>
                <span className="text-[10px] font-mono text-[#6B7280]">১৬:৯ Widescreen</span>
              </div>

              {/* 16:9 Image Preview */}
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-white border border-neutral-200 shadow-2xs flex items-center justify-center">
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
                  <div className="flex flex-col items-center justify-center text-neutral-400 text-xs">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span>কোনো ব্যানার নেই</span>
                  </div>
                )}

                {isSlotUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-medium gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#ED1025]" />
                    <span>আপলোড হচ্ছে...</span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="space-y-1.5 pt-1">
                <label className="w-full min-h-[38px] px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-[#171717] hover:text-[#ED1025] border border-neutral-300 hover:border-[#ED1025] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95 transition-all">
                  <Upload className="w-3.5 h-3.5 text-[#ED1025]" />
                  <span>
                    {isSlotUploading ? 'আপলোড হচ্ছে...' : `ব্যানার #${slotIndex + 1} ছবি নির্বাচন করুন`}
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

                {statusText && (
                  <p className="text-[11px] text-[#ED1025] font-medium flex items-center gap-1 justify-center">
                    <Sparkles className="w-3 h-3" />
                    <span>{statusText}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
