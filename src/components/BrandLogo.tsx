import React, { useState, useEffect } from 'react';
import { MusicService } from '../services/musicService';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'white' | 'red' | 'default';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
  variant = 'white',
}) => {
  const [branding, setBranding] = useState(() => MusicService.getBranding());
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    return MusicService.subscribe(() => {
      setBranding(MusicService.getBranding());
      setImageFailed(false);
    });
  }, []);

  // Height mappings
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10 sm:h-11',
    lg: 'h-12 sm:h-14',
  };

  const isWhite = variant === 'white';
  const customLogo = branding.logoUrl?.trim();

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {/* 1. Custom Uploaded Logo (if provided by user) */}
      {customLogo && !imageFailed ? (
        <img
          src={customLogo}
          alt={branding.studioName || 'Habajaba Studio LIVE'}
          className={`${heightClasses[size]} w-auto max-w-[160px] sm:max-w-[200px] object-contain shrink-0 rounded`}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        /* 2. Official High-Resolution Vector Lockup (Optimized for Red or Light Header) */
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Stylized Smiling H Emblem */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
              {/* Left Bar */}
              <rect
                x="24"
                y="24"
                width="12"
                height="42"
                rx="6"
                fill={isWhite ? '#FFFFFF' : '#ED1025'}
              />
              {/* Right Bar (Taller) */}
              <rect
                x="54"
                y="16"
                width="12"
                height="52"
                rx="6"
                fill={isWhite ? '#FFFFFF' : '#ED1025'}
              />
              {/* Smile Swoosh */}
              <path
                d="M 16 44 C 22 58, 62 64, 80 48"
                fill="none"
                stroke={isWhite ? '#FFFFFF' : '#ED1025'}
                strokeWidth="5.5"
                strokeLinecap="round"
              />
              {/* Left Hook */}
              <path
                d="M 16 44 C 14 38, 20 36, 22 39"
                fill="none"
                stroke={isWhite ? '#FFFFFF' : '#ED1025'}
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              {/* Right Circle Dot */}
              <circle
                cx="83"
                cy="46"
                r="4.5"
                fill={isWhite ? '#FFFFFF' : '#ED1025'}
              />
            </svg>
          </div>

          {/* Typography Lockup */}
          <div className="flex flex-col leading-none">
            <span
              className={`font-black tracking-tight text-lg sm:text-xl drop-shadow-xs ${
                isWhite ? 'text-white' : 'text-[#ED1025]'
              }`}
            >
              HabaJaba
            </span>
            <div
              className={`flex items-center gap-1 text-[10px] font-bold mt-0.5 ${
                isWhite ? 'text-white/90' : 'text-[#171717]'
              }`}
            >
              <span>—</span>
              <span className="font-semibold tracking-wide">Studio</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[8.5px] uppercase font-black tracking-wider ${
                  isWhite
                    ? 'bg-white text-[#ED1025] shadow-xs'
                    : 'bg-[#171717] text-white'
                }`}
              >
                LIVE
              </span>
              <span>—</span>
            </div>
          </div>
        </div>
      )}

      {showSubtitle && (
        <span
          className={`hidden md:inline-block text-xs pl-2.5 ml-1 font-medium font-bengali border-l ${
            isWhite ? 'text-white/85 border-white/25' : 'text-[#6B7280] border-[#EAEAEA]'
          }`}
        >
          {branding.tagline || 'অরিজিনাল বাংলা মিউজিক'}
        </span>
      )}
    </div>
  );
};
