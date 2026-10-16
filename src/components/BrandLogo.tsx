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

  // Height mappings
  const heightClasses = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-14',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {!imageFailed ? (
        <img
          src="/logo.svg"
          alt="HabaJaba Studio LIVE"
          className={`${heightClasses[size]} w-auto object-contain shrink-0`}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        /* Exact Vector Reproduction matching uploaded LOGO.png */
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Stylized Red Smiling H */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Left Bar */}
              <rect x="24" y="24" width="12" height="42" rx="6" fill="#ED1025" />
              {/* Right Bar (Taller) */}
              <rect x="54" y="16" width="12" height="52" rx="6" fill="#ED1025" />
              {/* Smile Swoosh */}
              <path
                d="M 16 44 C 22 58, 62 64, 80 48"
                fill="none"
                stroke="#ED1025"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Left Hook */}
              <path
                d="M 16 44 C 14 38, 20 36, 22 39"
                fill="none"
                stroke="#ED1025"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Right Circle Dot */}
              <circle cx="83" cy="46" r="4.5" fill="#ED1025" />
            </svg>
          </div>

          {/* Typography Lockup */}
          <div className="flex flex-col leading-none">
            <span className="font-extrabold tracking-tight text-[#ED1025] text-lg sm:text-xl">
              HabaJaba
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#171717] font-bold mt-0.5">
              <span>—</span>
              <span>Studio</span>
              <span className="px-1.5 py-0.2 rounded bg-[#171717] text-white text-[9px] uppercase font-black">
                LIVE
              </span>
              <span>—</span>
            </div>
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
