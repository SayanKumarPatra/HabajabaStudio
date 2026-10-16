import React from 'react';
import { ExternalLink } from 'lucide-react';
import { BrandingConfig } from '../types/music';

interface YouTubePromoSectionProps {
  branding?: BrandingConfig;
  className?: string;
}

export const YouTubePromoSection: React.FC<YouTubePromoSectionProps> = ({
  branding,
  className = '',
}) => {
  const channelUrl =
    branding?.youtubeChannelUrl?.trim() || 'https://www.youtube.com/@HabajabaStudioLive';

  return (
    <div
      className={`w-full rounded-xl sm:rounded-2xl border border-red-500/20 bg-white/80 backdrop-blur-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 shadow-xs hover:border-red-500/40 transition-all ${className}`}
      aria-label="Official YouTube Channel Strip"
    >
      {/* Left: Authentic Official YouTube Logo + Title in a single line */}
      <div className="flex items-center gap-3 min-w-0">
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center hover:opacity-90 transition-opacity"
          title="Habajaba Studio LIVE Official YouTube Channel"
        >
          {/* Authentic Official YouTube Red Icon */}
          <svg
            className="w-8 h-6 sm:w-9 sm:h-6.5 shrink-0 drop-shadow-xs"
            viewBox="0 0 68 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
              fill="#FF0000"
            />
            <polygon points="45,24 27,14 27,34" fill="#FFFFFF" />
          </svg>
        </a>

        <div className="flex items-center gap-2 truncate">
          <span className="text-xs sm:text-sm font-bold text-[#171717] truncate">
            Official YouTube Channel
          </span>
          <span className="hidden sm:inline text-xs text-[#6B7280]">
            · Habajaba Studio LIVE
          </span>
        </div>
      </div>

      {/* Right: Small Subscribe Button with Official YouTube Red */}
      <a
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#FF0000] hover:bg-[#D90000] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
        aria-label="Subscribe to Habajaba Studio Live on YouTube"
      >
        <span>Subscribe</span>
        <ExternalLink className="w-3 h-3 opacity-90" />
      </a>
    </div>
  );
};
