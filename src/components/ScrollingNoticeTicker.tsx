import React, { useState, useEffect } from 'react';
import { Sparkles, Radio, Users, Eye } from 'lucide-react';
import { VisitorService, VisitorStats } from '../services/visitorService';

export const ScrollingNoticeTicker: React.FC = () => {
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

  const NoticeItem = () => (
    <span className="text-xs sm:text-[13px] text-neutral-200 font-medium font-bengali tracking-normal pr-14 inline-flex items-center gap-2.5">
      {/* Live Visitor Tag */}
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>{stats.activeOnline} জন লাইভ শুনছেন</span>
      </span>

      <span>·</span>

      <span className="inline-flex items-center gap-1 text-neutral-300 text-[11px]">
        <Eye className="w-3 h-3 text-[#ED1025]" />
        <span>মোট ভিজিট:</span>
        <strong className="text-white font-mono">{formatNumber(stats.totalVisits)}</strong>
      </span>

      <span>·</span>

      <span>আপনাদের সাইটে আসার জন্য অসংখ্য ধন্যবাদ আমাদের সাইটটি কেমন লেগেছে নিচে কমেন্ট বক্স আছে সেখানে কমেন্ট করে দাও —</span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-amber-500/25 text-amber-300 border border-amber-400/50 font-bold shadow-xs animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span>এখানে আপনারা মোবাইল স্ক্রিন অফ রেখে গান শুনতে পারবেন</span>
      </span>
      <span className="text-neutral-400">।</span>
    </span>
  );

  return (
    <div
      className="w-full bg-[#1A1A1E]/95 border-b border-[#2C2C32] text-white shadow-xs backdrop-blur-md overflow-hidden select-none relative z-20 group"
      role="region"
      aria-label="Important Announcement"
    >
      <div className="max-w-7xl mx-auto flex items-center h-8 sm:h-9 px-3">
        {/* Static Left Pill Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ED1025] text-white text-[10px] sm:text-[11px] font-bold font-bengali shrink-0 z-10 shadow-xs mr-3">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>বিজ্ঞপ্তি</span>
        </div>

        {/* Scrolling Marquee Container with pause-on-hover */}
        <div className="flex-1 overflow-hidden relative flex items-center">
          <div className="inline-flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] cursor-default">
            <NoticeItem />
            <NoticeItem />
          </div>
        </div>
      </div>
    </div>
  );
};
