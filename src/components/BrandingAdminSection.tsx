import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Save,
  RotateCcw,
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('ইমেজ ফাইল (PNG, JPG, SVG, WebP) নির্বাচন করুন।');
      return;
    }

    setIsProcessing(true);
    try {
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
      await MusicService.saveBranding(updatedConfig);

      setSavedAlert({
        show: true,
        message: 'লোগো সফলভাবে লাইভ সেভ হয়েছে!',
      });
      setTimeout(() => setSavedAlert({ show: false, message: '' }), 3000);
    } catch (err) {
      console.error('Failed to upload branding image:', err);
      alert('লোগো আপলোড ব্যর্থ হয়েছে।');
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
      message: 'ব্র্যান্ডিং ও ইউটিউব তথ্য সেভ হয়েছে!',
    });
    setTimeout(() => setSavedAlert({ show: false, message: '' }), 3000);
  };

  const handleResetToDefault = async () => {
    if (confirm('ডিফল্ট লোগোতে ফিরতে চান?')) {
      const resetConfig: BrandingConfig = {
        logoUrl: '',
        studioName: 'Habajaba Studio LIVE',
        tagline: 'অরিজিনাল বাংলা মিউজিক',
      };
      setBranding(resetConfig);
      await MusicService.saveBranding(resetConfig);
      setSavedAlert({ show: true, message: 'ডিফল্ট লোগো সক্রিয় করা হয়েছে।' });
      setTimeout(() => setSavedAlert({ show: false, message: '' }), 2500);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl space-y-4 text-white">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#ED1025]" />
          <h3 className="text-base font-bold text-white">
            লোগো ও ব্র্যান্ডিং কাস্টমাইজেশন
          </h3>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>ডিফল্ট লোগো</span>
        </button>
      </div>

      {savedAlert.show && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedAlert.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Logo Upload & URL */}
        <div className="space-y-2">
          <label className="block font-bold text-neutral-300">
            লোগো ছবি (Logo Image)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center gap-2 border border-white/15 cursor-pointer transition-colors"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-[#ED1025]" />
              )}
              <span>লোগো ফাইল আপলোড</span>
            </button>

            <input
              type="url"
              value={branding.logoUrl || ''}
              onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
              placeholder="অথবা সরাসরি ইমেজ লিঙ্ক পেস্ট করুন"
              className="flex-1 w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white font-mono focus:border-[#ED1025] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Studio Name & Tagline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-neutral-300 mb-1">
              স্টুডিও নাম
            </label>
            <input
              type="text"
              value={branding.studioName || ''}
              onChange={(e) => setBranding({ ...branding, studioName: e.target.value })}
              placeholder="Habajaba Studio LIVE"
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-300 mb-1">
              বাংলা স্লোগান (Tagline)
            </label>
            <input
              type="text"
              value={branding.tagline || ''}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
              placeholder="অরিজিনাল বাংলা মিউজিক"
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white font-bengali focus:border-[#ED1025] focus:outline-hidden"
            />
          </div>
        </div>

        {/* YouTube Channel Promotion */}
        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
          <div className="flex items-center gap-2">
            <Youtube className="w-4 h-4 text-[#ED1025]" />
            <span className="font-bold text-white">
              অফিসিয়াল ইউটিউব চ্যানেল প্রমোশন
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                চ্যানেল লিংক
              </label>
              <input
                type="url"
                value={branding.youtubeChannelUrl || ''}
                onChange={(e) => setBranding({ ...branding, youtubeChannelUrl: e.target.value })}
                placeholder="https://www.youtube.com/@HabajabaStudioLive"
                className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white font-mono focus:border-[#ED1025] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                চ্যানেলের নাম
              </label>
              <input
                type="text"
                value={branding.youtubeChannelName || ''}
                onChange={(e) => setBranding({ ...branding, youtubeChannelName: e.target.value })}
                placeholder="Habajaba Studio LIVE"
                className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-1.5 pt-1">
          <label className="block font-bold text-neutral-300 text-xs">
            হেডার প্রিভিউ:
          </label>
          <div className="p-3 rounded-xl bg-[#ED1025] text-white flex items-center justify-between shadow-xs border border-red-700">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="Logo Preview"
                  className="h-8 w-auto object-contain shrink-0 rounded"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-white">
                    H
                  </div>
                  <div className="font-bold text-sm">{branding.studioName || 'Habajaba Studio LIVE'}</div>
                </div>
              )}
              <span className="hidden sm:inline-block text-xs font-bengali border-l border-white/30 pl-2 text-white/90">
                {branding.tagline || 'অরিজিনাল বাংলা মিউজিক'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold flex items-center gap-1.5 shadow-md shadow-[#ED1025]/30 cursor-pointer transition-colors active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>সেভ করুন</span>
          </button>
        </div>
      </form>
    </div>
  );
};
