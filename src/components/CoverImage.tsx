import React, { useState } from 'react';
import { Disc3, Music2, Radio } from 'lucide-react';

interface CoverImageProps {
  src?: string;
  alt: string;
  title?: string;
  artist?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  iconType?: 'disc' | 'music' | 'radio';
}

export const CoverImage: React.FC<CoverImageProps> = ({
  src,
  alt,
  title,
  artist,
  className = '',
  aspectRatio = 'square',
  iconType = 'disc',
}) => {
  const [hasError, setHasError] = useState(false);

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : 'aspect-square';

  // Seed subtle unique hue/pattern based on title
  const getGradientForTitle = (text?: string) => {
    if (!text) return 'from-neutral-900 to-neutral-800';
    const charCode = text.charCodeAt(0) + (text.charCodeAt(1) || 0);
    const variants = [
      'from-neutral-900 via-[#2A1014] to-neutral-950',
      'from-[#1A181B] via-[#2F1116] to-[#121214]',
      'from-neutral-950 via-[#1F1418] to-neutral-900',
      'from-[#201015] via-neutral-900 to-[#18181B]',
    ];
    return variants[charCode % variants.length];
  };

  const getInitials = (text?: string) => {
    if (!text) return 'HJ';
    const parts = text.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  // If source is missing or image load fails
  if (!src || hasError) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getGradientForTitle(
          title
        )} flex flex-col items-center justify-center p-3 text-white border border-[#EAEAEA]/20 shadow-inner select-none ${aspectClass} ${className}`}
        aria-label={alt}
      >
        {/* Subtle acoustic vinyl ring overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
          <div className="w-[120%] h-[120%] rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-[75%] h-[75%] rounded-full border border-white/25 flex items-center justify-center">
              <div className="w-[45%] h-[45%] rounded-full border border-[#ED1025]/40" />
            </div>
          </div>
        </div>

        {/* Brand red corner accent */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ED1025]" />
        </div>

        {/* Center icon or initials */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center text-white/90 mb-1.5">
            {iconType === 'radio' ? (
              <Radio className="w-4 h-4 text-[#ED1025]" />
            ) : iconType === 'music' ? (
              <Music2 className="w-4 h-4 text-[#ED1025]" />
            ) : (
              <Disc3 className="w-4 h-4 text-[#ED1025]" />
            )}
          </div>
          <span className="text-[11px] font-bold tracking-wider text-white/90 line-clamp-1">
            {getInitials(title || artist)}
          </span>
          {title && (
            <span className="text-[10px] text-white/60 line-clamp-1 max-w-[85%] mt-0.5 font-medium">
              {title}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-neutral-100 ${aspectClass} ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
};
