import React, { useState, useEffect } from 'react';
import { Database, HardDrive, RefreshCw, CheckCircle2, FolderDown } from 'lucide-react';
import { offlineCacheService, OfflineCacheStats } from '../services/offlineCacheService';
import { MusicService } from '../services/musicService';

export const OfflineAdminSection: React.FC = () => {
  const [stats, setStats] = useState<OfflineCacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrecaching, setIsPrecaching] = useState(false);
  const [precacheResult, setPrecacheResult] = useState<{ success: number; failed: number } | null>(null);
  const [swStatus, setSwStatus] = useState<string>('Checking...');

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const s = await offlineCacheService.getStats();
      setStats(s);

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.active) {
          setSwStatus('Active & Caching');
        } else if (reg) {
          setSwStatus('Installed');
        } else {
          setSwStatus('Not registered');
        }
      } else {
        setSwStatus('Not supported');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handlePrecacheAll = async () => {
    setIsPrecaching(true);
    setPrecacheResult(null);
    try {
      const albums = MusicService.getAlbums();
      const artists = MusicService.getArtists();
      const tracks = MusicService.getAllTracks('newest', true);

      await offlineCacheService.syncCatalog(albums, artists, tracks);
      const res = await offlineCacheService.precacheAllMedia(albums, artists, tracks);
      setPrecacheResult(res);
      await refreshStats();
    } catch (e: any) {
      alert('Pre-cache error: ' + (e.message || 'Unknown'));
    } finally {
      setIsPrecaching(false);
    }
  };

  return (
    <div className="space-y-4 text-white">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl text-white border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ED1025]/20 text-[#ED1025] flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>IndexedDB ও অফলাইন ক্যাশ (PWA)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {swStatus}
              </span>
            </h2>
            <p className="text-xs text-neutral-400 font-bengali">
              দুর্বল নেটওয়ার্কেও অ্যালবাম ও ছবি তাৎক্ষণিক দেখতে ক্যাশ মেমোরি ব্যবহার করা হয়।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refreshStats}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 border border-white/15 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            type="button"
            onClick={handlePrecacheAll}
            disabled={isPrecaching}
            className="px-4 py-1.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#ED1025]/30 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isPrecaching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FolderDown className="w-3.5 h-3.5" />
            )}
            <span>{isPrecaching ? 'ডাউনলোড হচ্ছে...' : 'সব প্রি-ক্যাশ করুন'}</span>
          </button>
        </div>
      </div>

      {precacheResult && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {precacheResult.success} টি ছবি সফলভাবে IndexedDB ও অফলাইন ক্যাশে সংরক্ষিত হয়েছে!
          </span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-sm">
          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">Cached Albums</span>
          <div className="text-xl font-black text-white font-mono">{stats?.albumCount ?? '--'}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-sm">
          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">Cached Artists</span>
          <div className="text-xl font-black text-white font-mono">{stats?.artistCount ?? '--'}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-sm">
          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">Cached Tracks</span>
          <div className="text-xl font-black text-white font-mono">{stats?.trackCount ?? '--'}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-sm">
          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">Cached Images</span>
          <div className="text-xl font-black text-white font-mono">{stats?.imageCount ?? '--'}</div>
        </div>
      </div>
    </div>
  );
};
