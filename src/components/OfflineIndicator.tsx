import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2, Database } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineCacheService, OfflineCacheStats } from '../services/offlineCacheService';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [stats, setStats] = useState<OfflineCacheStats | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    offlineCacheService.getStats().then(setStats);
  }, [isOnline]);

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div className="fixed top-14 md:top-16 left-0 right-0 z-50 px-3 py-1.5 flex justify-center pointer-events-none transition-all duration-300">
      <div className="pointer-events-auto max-w-md w-full">
        {!isOnline ? (
          <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/60 text-white rounded-2xl px-4 py-2.5 shadow-xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <div className="min-w-0">
                <p className="font-bold flex items-center gap-1.5 text-amber-300">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline Mode</span>
                </p>
                <p className="text-[11px] text-neutral-300 truncate">
                  Viewing cached albums &amp; artists via IndexedDB
                </p>
              </div>
            </div>

            {stats && (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-medium text-neutral-200 border border-neutral-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Database className="w-3 h-3 text-amber-400" />
                <span>{stats.albumCount} Albums</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-emerald-950/90 backdrop-blur-md border border-emerald-700/60 text-emerald-100 rounded-2xl px-4 py-2 shadow-lg flex items-center justify-center gap-2 text-xs animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Back Online</span>
            <span className="text-emerald-300 text-[11px]">· Live cloud sync restored</span>
          </div>
        )}

        {/* Expanded Offline Storage Details Modal / Dropdown */}
        {showDetails && !isOnline && stats && (
          <div className="mt-1.5 p-3 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 text-white shadow-2xl text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <span className="font-bold text-neutral-200">IndexedDB Offline Storage</span>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-neutral-800/80">
                <span className="text-neutral-400 block">Cached Albums</span>
                <span className="text-sm font-bold text-white">{stats.albumCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/80">
                <span className="text-neutral-400 block">Cached Artists</span>
                <span className="text-sm font-bold text-white">{stats.artistCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/80">
                <span className="text-neutral-400 block">Saved Tracks</span>
                <span className="text-sm font-bold text-white">{stats.trackCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/80">
                <span className="text-neutral-400 block">Cached Images</span>
                <span className="text-sm font-bold text-white">{stats.imageCount}</span>
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 pt-1">
              All album metadata and artist profiles are stored in device storage and remain accessible with limited or no internet connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
