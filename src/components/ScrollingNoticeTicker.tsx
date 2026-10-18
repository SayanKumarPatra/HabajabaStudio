import React from 'react';
import { Sparkles, Radio } from 'lucide-react';

export const ScrollingNoticeTicker: React.FC = () => {
  const NoticeItem = () => (
    <span className="text-xs sm:text-[13px] text-neutral-200 font-medium font-bengali tracking-normal pr-14 inline-flex items-center gap-2">
      <span>আপনাদের সাইটে আসার জন্য অসংখ্য ধন্যবাদ। আমাদের সাইটটি কেমন লেগেছে নিচে কমেন্ট বক্স আছে সেখানে কমেন্ট করে দিন।</span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold shadow-xs">
        <Sparkles className="w-3 h-3 text-emerald-300 shrink-0" />
        <span>এখানে আপনারা মোবাইল স্ক্রিন অফ রেখে গান শুনতে পারবেন</span>
      </span>
      <span>।</span>
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
