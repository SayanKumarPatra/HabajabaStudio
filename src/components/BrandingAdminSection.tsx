import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Save,
  RotateCcw,
  Sparkles,
  Cloud,
  Youtube,
} from 'lucide-react';
import { MusicService } from '../services/musicService';
import { BrandingConfig } from '../types/music';
import { uploadImageToCloud } from '../services/cloudStorageService';

export const BrandingAdminSection: React.FC = () => {
  const [branding, setBranding] = useState<BrandingConfig>(() => MusicService.getBranding());
  const [savedAlert, setSavedAlert] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return MusicService.subscribe(() => {
      setBranding(MusicService.getBranding());
    });
  }, []);

  // Handle local image file upload with cloud storage & real-time sync
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে শুধুমাত্র ইমেজ ফাইল (PNG, JPG, SVG, WebP) নির্বাচন করুন।');
      return;
    }

    setIsProcessing(true);
    try {
      // Direct upload to Firebase Cloud Storage with optimized fallback
      const uploadResult = await uploadImageToCloud(file, 'branding', {
        maxWidth: 512,
        maxHeight: 180,
        quality: 0.95,
        format: 'image/png',
      });

      const updatedConfig = {
        ...branding,
        logoUrl: uploadResult.url,
      };
      setBranding(updatedConfig);

      // Auto-persist immediately to Firestore, Realtime Database & local storage
      await MusicService.saveBranding(updatedConfig);

      setSavedAlert({
        show: true,
        message: uploadResult.isCloudStorage
          ? 'নতুন লোগো সরাসরি ফায়ারবেস ক্লাউড স্টোরেজে আপলোড ও লাইভ সেভ হয়েছে!'
          : 'লোগো সফলভাবে ব্রাউজারে সংরক্ষিত হয়েছে।',
      });
      setTimeout(() => setSavedAlert({ show: false, message: '' }), 4000);
    } catch (err) {
      console.error('Failed to upload branding image:', err);
      alert('লোগো আপলোড করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await MusicService.saveBranding(branding);
    setSavedAlert({
      show: true,
      message: 'ব্র্যান্ডিং ও ইউটিউব প্রমোশন সেটিংস সফলভাবে সেভ হয়েছে!',
    });
    setTimeout(() => setSavedAlert({ show: false, message: '' }), 3500);
  };

  const handleResetToDefault = async () => {
    if (confirm('আপনি কি ডিফল্ট অফিশিয়াল ভেক্টর লোগোতে ফিরে যেতে চান?')) {
      const resetConfig: BrandingConfig = {
        logoUrl: '',
        studioName: 'Habajaba Studio LIVE',
        tagline: 'অরিজিনাল বাংলা মিউজিক',
      };
      setBranding(resetConfig);
      await MusicService.saveBranding(resetConfig);
      setSavedAlert({ show: true, message: 'ডিফল্ট লোগো সক্রিয় করা হয়েছে।' });
      setTimeout(() => setSavedAlert({ show: false, message: '' }), 3000);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#ED1025]" />
              <span>লোগো ও ব্র্যান্ডিং কাস্টমাইজেশন (Official Studio Logo)</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1 font-bengali">
              আপনার ডাউনলোড করা নতুন লোগোটি এখানে আপলোড করুন। এটি স্বয়ংক্রিয়ভাবে উপরের রেড হেডারে প্রদর্শিত হবে।
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট লোগোতে ফিরুন</span>
          </button>
        </div>

        {/* Saved notification alert */}
        {savedAlert.show && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{savedAlert.message}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. Upload new logo file */}
          <div>
            <label className="block text-xs font-bold text-neutral-200 mb-2 font-bengali">
              ১. লোগো ইমেজ ফাইল আপলোড করুন (PNG, JPG, SVG, WebP)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="logo-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/15 transition-colors cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-[#ED1025]" />
                )}
                <span>ডিভাইস থেকে লোগো সিলেক্ট করুন (Upload File)</span>
              </button>

              <span className="text-xs text-neutral-400 font-medium">অথবা সরাসরি লিঙ্ক দিন:</span>

              <input
                type="url"
                value={branding.logoUrl || ''}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="flex-1 w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs focus:border-[#ED1025] focus:outline-hidden"
              />
            </div>
          </div>

          {/* 2. Studio Name & Bengali Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-200 mb-1">
                স্টুডিও নাম (Studio Name)
              </label>
              <input
                type="text"
                value={branding.studioName || ''}
                onChange={(e) => setBranding({ ...branding, studioName: e.target.value })}
                placeholder="Habajaba Studio LIVE"
                className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs focus:border-[#ED1025] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-200 mb-1">
                বাংলা স্লোগান (Tagline)
              </label>
              <input
                type="text"
                value={branding.tagline || ''}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                placeholder="অরিজিনাল বাংলা মিউজিক"
                className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-bengali focus:border-[#ED1025] focus:outline-hidden"
              />
            </div>
          </div>

          {/* 3. YouTube Channel Promotion Settings */}
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-[#ED1025]" />
              <span className="text-xs font-bold text-white">
                ইউটিউব চ্যানেল প্রমোশন লিংক ও তথ্য (YouTube Channel Promotion)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  ইউটিউব চ্যানেল ইউআরএল (Channel Link)
                </label>
                <input
                  type="url"
                  value={branding.youtubeChannelUrl || ''}
                  onChange={(e) => setBranding({ ...branding, youtubeChannelUrl: e.target.value })}
                  placeholder="https://www.youtube.com/@habajabastudio"
                  className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs focus:border-[#ED1025] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  চ্যানেলের নাম (Display Name)
                </label>
                <input
                  type="text"
                  value={branding.youtubeChannelName || ''}
                  onChange={(e) => setBranding({ ...branding, youtubeChannelName: e.target.value })}
                  placeholder="হ্যাবাজ্যাবা স্টুডিও (Habajaba Studio)"
                  className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs focus:border-[#ED1025] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 4. Real-Time Previews */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              রিয়েল-টাইম প্রিভিউ (Live Header Preview):
            </h4>

            {/* Live Preview on Red Header */}
            <div className="space-y-1">
              <span className="text-[11px] text-neutral-400 font-medium">
                হেডারের লাল ব্যাকগ্রাউন্ডে যেমন দেখাবে (Red Header):
              </span>
              <div className="p-4 rounded-xl bg-[#ED1025] text-white flex items-center justify-between shadow-xs border border-red-700">
                <div className="flex items-center gap-3">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt="Logo Preview"
                      className="h-10 w-auto object-contain shrink-0 rounded"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-white">
                        H
                      </div>
                      <div className="leading-tight">
                        <div className="font-extrabold text-white text-base">HabaJaba</div>
                        <div className="text-[9px] uppercase tracking-wider text-white/80 font-bold">
                          — Studio LIVE —
                        </div>
                      </div>
                    </div>
                  )}

                  <span className="hidden sm:inline-block text-xs font-bengali border-l border-white/30 pl-2.5 text-white/90">
                    {branding.tagline || 'অরিজিনাল বাংলা মিউজিক'}
                  </span>
                </div>

                <div className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full text-white">
                  Header Bar Preview
                </div>
              </div>
            </div>

            {/* Preview on Dark Glass Panel */}
            <div className="space-y-1">
              <span className="text-[11px] text-neutral-400 font-medium">
                ডার্ক গ্লাস ব্যাকগ্রাউন্ডে প্রিভিউ (Dark Glass):
              </span>
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center gap-3 backdrop-blur-md">
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Logo Preview Dark"
                    className="h-10 w-auto object-contain shrink-0 rounded"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#ED1025] text-white flex items-center justify-center font-black">
                      H
                    </div>
                    <span className="font-extrabold text-[#ED1025] text-base">HabaJaba Studio</span>
                  </div>
                )}
                <span className="text-xs text-neutral-300 font-bengali">
                  {branding.tagline || 'অরিজিনাল বাংলা মিউজিক'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#ED1025]/30 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>লোগো ও ব্র্যান্ডিং সেভ করুন (Save Branding)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
