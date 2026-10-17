import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Check,
  User,
  Sparkles,
  Link,
  Youtube,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Artist } from '../types/music';
import { MusicService } from '../services/musicService';
import { uploadImageToCloud } from '../services/cloudStorageService';

interface ArtistEditModalProps {
  isOpen: boolean;
  artist: Artist | null;
  onClose: () => void;
  onSaved?: (updatedArtist: Artist) => void;
}

export const ArtistEditModal: React.FC<ArtistEditModalProps> = ({
  isOpen,
  artist,
  onClose,
  onSaved,
}) => {
  const [formData, setFormData] = useState<Artist>({
    id: '',
    name: '',
    avatarUrl: '',
    role: 'Bengali Vocalist',
    bio: '',
    youtubeUrl: '',
    socialUrl: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (artist) {
      setFormData({
        id: artist.id || `artist-${Date.now()}`,
        name: artist.name || '',
        avatarUrl: artist.avatarUrl || '',
        role: artist.role || 'Bengali Vocalist',
        bio: artist.bio || '',
        youtubeUrl: artist.youtubeUrl || '',
        socialUrl: artist.socialUrl || '',
      });
    } else {
      setFormData({
        id: `artist-${Date.now()}`,
        name: '',
        avatarUrl: '',
        role: 'Bengali Vocalist',
        bio: '',
        youtubeUrl: '',
        socialUrl: '',
      });
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadStatus(null);
  }, [artist, isOpen]);

  if (!isOpen) return null;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadStatus('ছবি অপ্টিমাইজ ও আপলোড হচ্ছে...');

    try {
      const uploadResult = await uploadImageToCloud(file, 'artists', {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        format: 'image/jpeg',
      });

      setFormData((prev) => ({
        ...prev,
        avatarUrl: uploadResult.url,
      }));

      setUploadStatus(
        uploadResult.isCloudStorage
          ? 'Firebase Cloud Storage-এ সংরক্ষিত হয়েছে!'
          : 'ছবি সফলভাবে লোড হয়েছে!'
      );
    } catch (err: any) {
      console.error('Failed to upload artist avatar:', err);
      setErrorMessage('ছবি আপলোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('শিল্পীর নাম দেওয়া আবশ্যক।');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated: Artist = {
        ...formData,
        id: formData.id || `artist-${Date.now()}`,
        avatarUrl: formData.avatarUrl || '/logo.svg',
      };

      await MusicService.saveArtist(updated);
      setSuccessMessage('শিল্পীর প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
      if (onSaved) onSaved(updated);

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save artist:', err);
      setErrorMessage('প্রোফাইল সেভ করতে সমস্যা হয়েছে।');
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#121319]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/15 overflow-hidden flex flex-col max-h-[90vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ED1025]/20 text-[#ED1025] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                শিল্পীর প্রোফাইল এডিট (Artist Profile)
              </h3>
              <p className="text-[11px] text-neutral-400">
                শিল্পীর ছবি, ভূমিকা ও পরিচিতি আপডেট করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Profile Picture Upload & Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            {/* Avatar Preview */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-neutral-900 border-2 border-white/20 shadow-md shrink-0 flex items-center justify-center">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.name || 'Artist Avatar'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              ) : (
                <User className="w-10 h-10 text-neutral-400" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <label className="text-xs font-bold text-neutral-200 block">
                শিল্পীর ছবি আপলোড (Artist Profile Picture)
              </label>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'আপলোড হচ্ছে...' : 'নতুন ছবি বাছুন'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                {formData.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: '' }))}
                    className="text-xs text-neutral-400 hover:text-red-400 px-2.5 py-1 cursor-pointer"
                  >
                    ছবি মুছুন
                  </button>
                )}
              </div>
              {uploadStatus && (
                <p className="text-[11px] text-[#ED1025] font-medium flex items-center gap-1 justify-center sm:justify-start">
                  <Sparkles className="w-3 h-3" />
                  <span>{uploadStatus}</span>
                </p>
              )}
            </div>
          </div>

          {/* Artist Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#ED1025]" />
              <span>শিল্পীর নাম (Artist Name) *</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="যেমন: অনুপম রায়, রূপম ইসলাম, শ্রেয়া ঘোষাল"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 focus:border-[#ED1025] text-xs sm:text-sm bg-black/60 text-white placeholder-neutral-500 outline-hidden"
              required
            />
          </div>

          {/* Role / Genre */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <span>ভূমিকা ও বিভাগ (Role / Genre)</span>
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              placeholder="যেমন: মূল কণ্ঠশিল্পী / Lead Vocalist, অ্যাকোস্টিক গিটারিস্ট"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 focus:border-[#ED1025] text-xs sm:text-sm bg-black/60 text-white placeholder-neutral-500 outline-hidden"
            />
          </div>

          {/* Bio / Story */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#ED1025]" />
              <span>শিল্পী পরিচিতি ও বায়োগাফি (Biography)</span>
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="শিল্পীর মিউজিক্যাল ব্যাকগ্রাউন্ড, স্টুডিও ট্র্যাক বিবরণ..."
              className="w-full px-3.5 py-2 rounded-xl border border-white/15 focus:border-[#ED1025] text-xs sm:text-sm bg-black/60 text-white placeholder-neutral-500 outline-hidden resize-none"
            />
          </div>

          {/* YouTube or Social Channel Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-200 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>ইউটিউব চ্যানেল / ভিডিও লিংক</span>
              </label>
              <input
                type="url"
                value={formData.youtubeUrl || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
                placeholder="https://youtube.com/@channel"
                className="w-full px-3 py-2 rounded-xl border border-white/15 focus:border-[#ED1025] text-xs bg-black/60 text-white placeholder-neutral-500 outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-200 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-neutral-400" />
                <span>অন্যান্য সোশ্যাল লিংক (Optional)</span>
              </label>
              <input
                type="url"
                value={formData.socialUrl || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, socialUrl: e.target.value }))}
                placeholder="https://facebook.com/..."
                className="w-full px-3 py-2 rounded-xl border border-white/15 focus:border-[#ED1025] text-xs bg-black/60 text-white placeholder-neutral-500 outline-hidden"
              />
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 rounded-xl border border-white/15 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              বাতিল (Cancel)
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="min-h-[40px] px-6 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#ED1025]/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>প্রোফাইল আপডেট করুন (Save)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
