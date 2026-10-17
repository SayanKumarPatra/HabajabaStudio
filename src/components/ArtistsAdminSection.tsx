import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Youtube,
  Check,
  Search,
  ArrowLeft,
  Upload,
  AlertTriangle,
  User,
  Sparkles,
} from 'lucide-react';
import { Artist } from '../types/music';
import { MusicService } from '../services/musicService';
import { uploadImageToCloud } from '../services/cloudStorageService';

export const ArtistsAdminSection: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>(() => MusicService.getArtists());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // In-Page Mode: 'list' or 'edit' (NO POPUPS)
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  // In-Page Delete Confirmation (NO POPUP)
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);

  // In-page form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('Bengali Artist');
  const [bio, setBio] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/logo.svg');
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return MusicService.subscribe(() => {
      setArtists(MusicService.getArtists());
    });
  }, []);

  const filteredArtists = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.role && a.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartAdd = () => {
    setEditingArtist(null);
    setName('');
    setRole('Bengali Artist');
    setBio('');
    setYoutubeUrl('');
    setAvatarUrl('/logo.svg');
    setArtistToDelete(null);
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setName(artist.name);
    setRole(artist.role || 'Bengali Artist');
    setBio(artist.bio || '');
    setYoutubeUrl(artist.youtubeUrl || '');
    setAvatarUrl(artist.avatarUrl || '/logo.svg');
    setArtistToDelete(null);
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setViewMode('list');
    setEditingArtist(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAvatarUploading(true);
    try {
      const res = await uploadImageToCloud(file, 'artists', {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.75,
        format: 'image/jpeg',
      });
      setAvatarUrl(res.url);
    } catch {
      setStatusMessage('ছবি আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsAvatarUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const artistData: Artist = {
      id: editingArtist?.id || `artist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      role: role.trim() || 'Bengali Artist',
      bio: bio.trim(),
      youtubeUrl: youtubeUrl.trim() || undefined,
      avatarUrl: avatarUrl.trim() || '/logo.svg',
    };

    try {
      await MusicService.saveArtist(artistData);
      setViewMode('list');
      setEditingArtist(null);
      setStatusMessage(`"${artistData.name}" এর তথ্য সফলভাবে লাইভ সেভ হয়েছে! ⚡`);
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!artistToDelete) return;
    const nameToDelete = artistToDelete.name;
    const idToDelete = artistToDelete.id;
    setArtistToDelete(null);

    await MusicService.deleteArtist(idToDelete);
    setStatusMessage(`"${nameToDelete}" শিল্পীর প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে!`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 1. IN-PAGE ARTIST EDIT / CREATE FULL VIEW (NO POPUP)
  if (viewMode === 'edit') {
    return (
      <div className="w-full space-y-5 text-white">
        {/* Top Navigation Bar */}
        <div className="p-4 sm:p-5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>শিল্পী তালিকায় ফিরে যান</span>
          </button>

          <span className="text-sm font-bold text-white flex items-center gap-1.5 font-bengali">
            <Users className="w-4 h-4 text-[#ED1025]" />
            <span>{editingArtist ? 'শিল্পী প্রোফাইল সম্পাদনা' : 'নতুন শিল্পী যোগ'}</span>
          </span>
        </div>

        {/* Full In-Page Editor Form */}
        <form onSubmit={handleSaveArtist} className="p-5 sm:p-7 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Metadata */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5 font-bengali">
                  শিল্পীর নাম (Artist Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: অনির্বাণ চক্রবর্তী"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white text-sm focus:border-[#ED1025] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5 font-bengali">
                  ভূমিকা / ক্যাটাগরি (Role / Tag)
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="যেমন: Lead Vocalist, Classical Vocal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white text-sm focus:border-[#ED1025] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5 font-bengali">
                  ইউটিউব চ্যানেল / ভিডিও লিঙ্ক (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <Youtube className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/@channel"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5 font-bengali">
                  শিল্পীর পরিচিতি (Short Bio)
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="শিল্পীর সঙ্গীত জীবন ও অভিজ্ঞতা..."
                  className="w-full p-3 rounded-xl border border-white/15 bg-black/60 text-white text-xs focus:border-[#ED1025] focus:outline-hidden font-bengali resize-none"
                />
              </div>
            </div>

            {/* Right: Avatar & Image Preview */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-300 block font-bengali">
                শিল্পীর ছবি (Profile Avatar)
              </label>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#ED1025] bg-neutral-900 shrink-0 relative shadow-lg">
                  <img
                    src={avatarUrl || '/logo.svg'}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.svg';
                    }}
                  />
                </div>

                <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="ছবির সরাসরি লিঙ্ক"
                    className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
                  />
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isAvatarUploading ? 'আপলোড হচ্ছে...' : 'ডিভাইস থেকে ছবি আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-bengali leading-relaxed">
                ⚡ তথ্য সেভ করলেই তা সরাসরি লাইভ ডাটাবেসে আপডেট হয়ে যাবে এবং হোমপেজের শিল্পী তালিকা ও ফিল্টারে সাথে সাথে প্রদর্শিত হবে।
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs shadow-md shadow-[#ED1025]/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল সেভ করুন ⚡'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 2. IN-PAGE ARTIST LIST VIEW (NO POPUPS)
  return (
    <div className="w-full space-y-5 text-white">
      {/* Toast Alert */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* In-Page Delete Confirmation Bar (NO POPUP) */}
      {artistToDelete && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/30 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-bengali">
                আপনি কি নিশ্চিতভাবে "{artistToDelete.name}" এর প্রোফাইল মুছে ফেলতে চান?
              </div>
              <div className="text-xs text-neutral-300 font-bengali">
                এটি লাইভ সার্ভার এবং অফলাইন ক্যাশ থেকে স্থায়ীভাবে ডিলিট হয়ে যাবে।
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setArtistToDelete(null)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-300 cursor-pointer transition-colors"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md cursor-pointer transition-colors"
            >
              হ্যাঁ, মুছে ফেলুন
            </button>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="p-4 sm:p-5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 text-[#ED1025] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>শিল্পী ও প্রোফাইল ব্যবস্থাপনা ({artists.length})</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                লাইভ সিঙ্ক
              </span>
            </h3>
            <p className="text-xs text-neutral-400 font-bengali">
              শিল্পীদের ছবি ও পরিচিতি সম্পূর্ণ ফুল-পেজ ভিউতে পরিচালনা করুন (কোনো পপআপ ছাড়া)।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Filter */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিল্পী খুঁজুন..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-white/15 focus:border-[#ED1025] focus:outline-hidden bg-black/60 text-white placeholder-neutral-500"
            />
          </div>

          <button
            type="button"
            onClick={handleStartAdd}
            className="min-h-[38px] px-4 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#ED1025]/30 transition-colors cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>নতুন শিল্পী যোগ</span>
          </button>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredArtists.map((artist) => {
          return (
            <div
              key={artist.id}
              className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#ED1025]/40 transition-all shadow-md group flex flex-col justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-900 border-2 border-white/15 group-hover:border-[#ED1025] transition-colors shrink-0">
                  <img
                    src={artist.avatarUrl || '/logo.svg'}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.svg';
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{artist.name}</h4>
                  <p className="text-xs text-neutral-400 truncate">{artist.role || 'শিল্পী'}</p>
                  {artist.youtubeUrl && (
                    <div className="text-[11px] text-red-400 flex items-center gap-1 mt-0.5 truncate">
                      <Youtube className="w-3 h-3 shrink-0" />
                      <span className="truncate">YouTube</span>
                    </div>
                  )}
                </div>
              </div>

              {artist.bio && (
                <p className="text-xs text-neutral-300 font-bengali line-clamp-2 leading-relaxed">
                  {artist.bio}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleStartEdit(artist)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#ED1025] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setArtistToDelete(artist)}
                  className="p-1.5 rounded-lg bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white transition-colors cursor-pointer"
                  title="Remove Artist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredArtists.length === 0 && (
        <div className="p-8 text-center bg-black/40 backdrop-blur-xl rounded-2xl border border-dashed border-white/15 text-neutral-400 text-xs font-bengali">
          কোনো শিল্পী মেলেনি।
        </div>
      )}
    </div>
  );
};
