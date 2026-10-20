import React, { useState, useEffect } from 'react';
import { Users, Eye, Radio, Activity, TrendingUp } from 'lucide-react';
import { VisitorService, VisitorStats } from '../services/visitorService';

interface WebsiteVisitorCounterProps {
  variant?: 'card' | 'compact' | 'minimal';
  className?: string;
}

export const WebsiteVisitorCounter: React.FC<WebsiteVisitorCounterProps> = ({
  variant = 'card',
  className = '',
}) => {
  const [stats, setStats] = useState<VisitorStats>(() => VisitorService.getStats());

  useEffect(() => {
    const unsubscribe = VisitorService.subscribe((newStats) => {
      setStats(newStats);
    });
    return unsubscribe;
  }, []);

  // Format numbers nicely with commas (e.g. 1,420)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center gap-2 text-xs text-neutral-300 ${className}`}>
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{stats.activeOnline} জন লাইভ</span>
        </span>
        <span className="text-neutral-500">·</span>
        <span className="flex items-center gap-1 text-neutral-400">
          <Eye className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-mono tabular-nums text-white font-semibold">{formatNumber(stats.totalVisits)}</span>
          <span className="font-bengali">ভিজিট</span>
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-xs font-semibold text-emerald-300 font-bengali">
            {stats.activeOnline} জন এখন শুনছেন
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-400 font-bengali">
          <span>মোট ভিজিটর:</span>
          <span className="font-mono font-bold text-white tabular-nums">
            {formatNumber(stats.totalVisits)}
          </span>
        </div>
      </div>
    );
  }

  // Default 'card' layout: rich, aesthetic live stats widget
  return (
    <div
      className={`rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-3 sm:p-4 text-white shadow-lg space-y-3 ${className}`}
      aria-label="Website Live Visitor Metrics"
    >
      {/* Header with Live Status Pulse */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#ED1025]/20 text-[#ED1025] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 font-bengali">
              <span>ওয়েবসাইট লাইভ ভিজিটর</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h4>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 font-bengali">
              রিয়েল-টাইম লাইভ শ্রোতা ও মোট ভিজিট ট্র্যাকার
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>LIVE SYNC</span>
        </span>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-2">
        {/* Metric 1: Live Online Now */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bengali">অনলাইন</span>
          </div>
          <div className="text-sm sm:text-lg font-black text-white font-mono tabular-nums leading-none">
            {stats.activeOnline}
          </div>
          <div className="text-[9px] sm:text-[10px] text-neutral-400 font-bengali mt-0.5">
            শ্রোতা লাইভ
          </div>
        </div>

        {/* Metric 2: Today's Visits */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-amber-400 text-[10px] font-semibold mb-0.5">
            <TrendingUp className="w-3 h-3" />
            <span className="font-bengali">আজকের</span>
          </div>
          <div className="text-sm sm:text-lg font-black text-white font-mono tabular-nums leading-none">
            {formatNumber(stats.todayVisits)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-neutral-400 font-bengali mt-0.5">
            আজকের ভিজিট
          </div>
        </div>

        {/* Metric 3: Total All-time Visits */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-[#ED1025]/10 border border-[#ED1025]/30 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[#ED1025] text-[10px] font-semibold mb-0.5">
            <Eye className="w-3 h-3" />
            <span className="font-bengali">সর্বমোট</span>
          </div>
          <div className="text-sm sm:text-lg font-black text-[#ED1025] font-mono tabular-nums leading-none">
            {formatNumber(stats.totalVisits)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-neutral-300 font-bengali mt-0.5">
            মোট ভিজিটর
          </div>
        </div>
      </div>
    </div>
  );
};
