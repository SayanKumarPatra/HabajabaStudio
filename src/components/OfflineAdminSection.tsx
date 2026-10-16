import React, { useState, useEffect } from 'react';
import { Database, HardDrive, RefreshCw, CheckCircle2, ShieldCheck, WifiOff, Sparkles, FolderDown, ArrowRight } from 'lucide-react';
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
          setSwStatus('Active & Intercepting Requests (Cache-First)');
        } else if (reg) {
          setSwStatus('Installed / Activating');
        } else {
          setSwStatus('Not registered yet');
        }
      } else {
        setSwStatus('Service Worker not supported by browser');
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

      // 1. Sync metadata to IndexedDB
      await offlineCacheService.syncCatalog(albums, artists, tracks);

      // 2. Pre-cache all media images
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-neutral-900 text-white relative overflow-hidden border border-neutral-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-bold text-red-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Offline Resilience &amp; PWA Engine</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              IndexedDB &amp; Service Worker Offline Cache
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl font-bengali">
              ব্যবহারকারীদের সীমিত নেটওয়ার্ক কানেক্টিভিটি থাকলেও যাতে সব অ্যালবাম মেটাডাটা ও শিল্পীদের ছবি তাৎক্ষণিক ভিউ করা যায়, সেজন্য ক্যাশ-ফার্স্ট কৌশল ও IndexedDB সমন্বয় করা হয়েছে।
            </p>
          </div>

          <button
            type="button"
            onClick={refreshStats}
            disabled={isLoading}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-2 border border-neutral-700 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>স্ট্যাটাস রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Cache Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAEAEA] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6B7280]">Cached Albums</span>
            <FolderDown className="w-4 h-4 text-[#ED1025]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#171717] font-mono">
            {stats?.albumCount ?? 0}
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">অ্যালবাম টাইটেল ও ট্র্যাক লিস্ট</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAEAEA] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6B7280]">Cached Artists</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#171717] font-mono">
            {stats?.artistCount ?? 0}
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">বায়োগ্রাফি ও প্রোফাইল ডাটা</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAEAEA] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6B7280]">Saved Tracks</span>
            <HardDrive className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#171717] font-mono">
            {stats?.trackCount ?? 0}
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">গানের সম্পূর্ণ মেটাডাটা</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAEAEA] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6B7280]">Image Blobs</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#171717] font-mono">
            {stats?.imageCount ?? 0}
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">কভার ও শিল্পীর ফটো ডাটা</p>
        </div>
      </div>

      {/* Architecture & Action Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: How Cache-First works */}
        <div className="p-6 rounded-3xl bg-white border border-[#EAEAEA] shadow-xs space-y-4">
          <h3 className="font-bold text-[#171717] text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ED1025]" />
            <span>ক্যাশ-ফার্স্ট (Cache-First) আর্কিটেকচার</span>
          </h3>
          <ul className="space-y-3 text-xs text-[#4B5563]">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-red-50 text-[#ED1025] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                <strong>IndexedDB Local Store:</strong> ব্রাউজারের অভ্যন্তরীণ IndexedDB ডাটাবেজে (`HabajabaStudioOfflineDB`) অ্যালবাম ও শিল্পীদের বায়ো রিয়েল-টাইমে সেভ করা থাকে।
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-red-50 text-[#ED1025] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span>
                <strong>Service Worker Image Interception:</strong> ইমেজ ফাইল ও শিল্পীদের অবতার রিকোয়েস্টগুলোকে সার্ভিস ওয়ার্কার `sw.js` ক্যাশ মেমোরি থেকে সবার আগে রিটার্ন করে।
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-red-50 text-[#ED1025] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span>
                <strong>অফলাইন ট্রানজিশন:</strong> ইন্টারনেট সংযোগ না থাকলেও অ্যালবাম তালিকা, প্রতিটি গানের তথ্য এবং শিল্পীদের ছবি নির্বিঘ্নে স্ক্রিনে প্রদর্শিত হয়।
              </span>
            </li>
          </ul>

          <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">Service Worker স্ট্যাটাস:</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{swStatus}</span>
            </span>
          </div>
        </div>

        {/* Right: Manual Pre-cache Trigger */}
        <div className="p-6 rounded-3xl bg-white border border-[#EAEAEA] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-[#171717] text-base flex items-center gap-2">
              <FolderDown className="w-4 h-4 text-indigo-600" />
              <span>সব মিডিয়া প্রি-ক্যাশ করুন (Pre-cache All for Offline)</span>
            </h3>
            <p className="text-xs text-[#6B7280] font-bengali leading-relaxed">
              এক ক্লিকে বর্তমান সব অ্যালবাম কভার আর্ট ও শিল্পীদের প্রোফাইল ফটো ডাউনলোড করে ব্রাউজারের অফলাইন স্টোরেজে সংরক্ষণ করে রাখুন। এতে দুর্বল নেটওয়ার্কেও সাথে সাথে ছবি লোড হবে।
            </p>

            {precacheResult && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  সফলভাবে {precacheResult.success} টি ইমেজ IndexedDB ও ক্যাশে সংরক্ষিত হয়েছে!
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#EAEAEA]">
            <button
              type="button"
              onClick={handlePrecacheAll}
              disabled={isPrecaching}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isPrecaching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ক্যাশ ডাউনলোড ও প্রসেসিং হচ্ছে...</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-4 h-4" />
                  <span>এখনই সব প্রি-ক্যাশ করুন (Pre-cache All Now)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
