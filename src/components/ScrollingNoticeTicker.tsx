import React from 'react';
import { Headphones, Sparkles, Volume2 } from 'lucide-react';

export const ScrollingNoticeTicker: React.FC = () => {
  const noticeText =
    'আমাদের এখানে আপনি গান চালিয়ে মোবাইল স্ক্রিন অফ করে শুনতে পারবেন হেডফোন দিয়ে আপনাদের সুবিধার জন্য আমাদের এই সাইটটি তৈরি করা হয়েছে আপনাদের কেমন লেগেছে অবশ্যই তাদের মন্তব্য একটা বক্স রয়েছে ওখানে আপনারা অবশ্যই জানাবেন এবং কোথা থেকে দেখছেন সেটাও জানাবেন তবে আমরা আরো উৎসাহিত হব আপনাদের এই ওয়েবসাইটে আসার জন্য অসংখ্য ধন্যবাদ ।';

  return (
    <div
      className="w-full bg-[#1A1A1E]/95 border-b border-[#2C2C32] text-white shadow-xs backdrop-blur-md overflow-hidden select-none relative z-20 group"
      role="region"
      aria-label="Important Announcement"
    >
      <div className="max-w-7xl mx-auto flex items-center h-8 sm:h-9 px-3">
        {/* Static Left Pill Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ED1025] text-white text-[10px] sm:text-[11px] font-bold font-bengali shrink-0 z-10 shadow-xs mr-3">
          <Headphones className="w-3 h-3 animate-pulse" />
          <span>বিশেষ নোটিশ</span>
        </div>

        {/* Scrolling Marquee Container with pause-on-hover */}
        <div className="flex-1 overflow-hidden relative flex items-center">
          <div className="inline-flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] cursor-default">
            <span className="text-xs sm:text-sm text-neutral-200 font-medium font-bengali tracking-normal pr-16 inline-flex items-center gap-2">
              <span>{noticeText}</span>
              <Sparkles className="w-3 h-3 text-[#ED1025] inline-block shrink-0" />
            </span>
            <span className="text-xs sm:text-sm text-neutral-200 font-medium font-bengali tracking-normal pr-16 inline-flex items-center gap-2" aria-hidden="true">
              <span>{noticeText}</span>
              <Sparkles className="w-3 h-3 text-[#ED1025] inline-block shrink-0" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
