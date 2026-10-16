import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Dimension mapping
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* If user uploaded LOGO.png exists in root/public, try rendering it first */}
      {!imageFailed ? (
        <img
          src="/LOGO.png"
          alt="Habajaba Studio LIVE"
          className={`${heightClasses[size]} w-auto object-contain shrink-0`}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        /* Pristine, brand-accurate SVG Vector Logo for Habajaba Studio LIVE */
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#ED1025] text-white shadow-sm shadow-[#ED1025]/25 shrink-0">
            {/* Live studio acoustics icon */}
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Studio Microphone & Soundwaves */}
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="white" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
              <line x1="8" x2="16" y1="22" y2="22" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          </div>

          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-tight text-[#171717] text-base md:text-lg">
                HABAJABA
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#ED1025] text-white uppercase">
                LIVE
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wider text-[#6B7280] uppercase mt-0.5">
              STUDIO
            </span>
          </div>
        </div>
      )}

      {showSubtitle && (
        <span className="hidden sm:inline-block text-xs text-[#6B7280] border-l border-[#EAEAEA] pl-2.5 ml-1 font-medium font-bengali">
          অরিজিনাল বাংলা মিউজিক
        </span>
      )}
    </div>
  );
};
