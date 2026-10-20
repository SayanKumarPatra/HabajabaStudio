import React, { useState, useEffect } from 'react';
import { Eye, Radio, Activity, TrendingUp, Users, Youtube } from 'lucide-react';
import { VisitorService, VisitorStats } from '../services/visitorService';

export const FooterLiveMetrics: React.FC = () => {
  const [stats, setStats] = useState<VisitorStats>(() => VisitorService.getStats());

  useEffect(() => {
    const unsub = VisitorService.subscribe((newStats) => {
      setStats(newStats);
    });
    return unsub;
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="w-full pt-4 pb-1 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      {/* 1. Compact Live YouTube Subscriber Counter Embed */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between sm:justify-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border-0 border-none shadow-inner">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
            <Youtube className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-[11px] font-bold text-white font-bengali block leading-tight">
              ইউটিউব সাবস্ক্রাইবার
            </span>
            <span className="text-[9px] text-neutral-400 font-mono">
              @HabajabaStudioLive
            </span>
          </div>
        </div>

        {/* Embedded Live Subscriber Counter (Compact 300x80) */}
        <div className="w-full sm:w-auto flex justify-center sm:justify-start overflow-hidden rounded-lg bg-black/60">
          <iframe
            height="80px"
            width="300px"
            frameBorder="0"
            src="https://livecounts.io/embed/youtube-live-subscriber-counter/UCduw6YMUc_SHf1sQV6SW_nw"
            style={{ border: 0, width: '300px', height: '80px', maxWidth: '100%' }}
            title="Habajaba Studio Live YouTube Subscribers Counter"
            loading="lazy"
          />
        </div>
      </div>

      {/* 2. Compact Live Website Visitor Counter */}
      <div className="flex flex-col justify-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border-0 border-none shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ED1025]/20 text-[#ED1025] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white font-bengali">
              ওয়েবসাইট লাইভ ভিজিটর মেট্রিক্স
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
          </span>
        </div>

        {/* 3 Compact Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Active Online Now */}
          <div className="px-2 py-1.5 rounded-lg bg-black/50 border border-white/5">
            <div className="text-[9px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bengali">অনলাইন</span>
            </div>
            <div className="text-sm font-black text-white font-mono tabular-nums leading-tight mt-0.5">
              {stats.activeOnline}
            </div>
            <div className="text-[9px] text-neutral-400 font-bengali">
              লাইভ শ্রোতা
            </div>
          </div>

          {/* Today's Visits */}
          <div className="px-2 py-1.5 rounded-lg bg-black/50 border border-white/5">
            <div className="text-[9px] text-amber-400 font-semibold flex items-center justify-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="font-bengali">আজকের</span>
            </div>
            <div className="text-sm font-black text-white font-mono tabular-nums leading-tight mt-0.5">
              {formatNumber(stats.todayVisits)}
            </div>
            <div className="text-[9px] text-neutral-400 font-bengali">
              আজকের ভিজিট
            </div>
          </div>

          {/* Total Lifetime Visits */}
          <div className="px-2 py-1.5 rounded-lg bg-[#ED1025]/15 border border-[#ED1025]/30">
            <div className="text-[9px] text-[#ED1025] font-semibold flex items-center justify-center gap-1">
              <Eye className="w-2.5 h-2.5" />
              <span className="font-bengali">সর্বমোট</span>
            </div>
            <div className="text-sm font-black text-[#ED1025] font-mono tabular-nums leading-tight mt-0.5">
              {formatNumber(stats.totalVisits)}
            </div>
            <div className="text-[9px] text-neutral-300 font-bengali">
              মোট ভিজিটর
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
