import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BannerSlide } from '../types/music';
import { defaultSlidingBanners } from '../services/musicService';

interface SlidingBannerCarouselProps {
  banners: BannerSlide[];
  onSlideClick?: (slide: BannerSlide, index: number) => void;
  className?: string;
}

export const SlidingBannerCarousel: React.FC<SlidingBannerCarouselProps> = ({
  banners,
  onSlideClick,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Display all banners dynamically with no artificial limit
  const safeBanners = banners && banners.length > 0 ? banners : defaultSlidingBanners;

  // Auto slide every 4.5 seconds if not hovered
  useEffect(() => {
    if (safeBanners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % safeBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [safeBanners.length, isHovered]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % safeBanners.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + safeBanners.length) % safeBanners.length);
  };

  // Touch Swipe Handlers for mobile ergonomics
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      goToNext(); // Swiped left -> next
    } else if (diff < -45) {
      goToPrev(); // Swiped right -> prev
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (safeBanners.length === 0) return null;

  return (
    <section
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#EAEAEA] shadow-xs bg-white select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Official Sliding Banners"
    >
      {/* Sliding track container - Exact 16:9 / ergonomic mobile ratio */}
      <div className="relative aspect-[21/9] xs:aspect-[2.35/1] sm:aspect-[2.5/1] md:aspect-[16/9] w-full max-h-[145px] xs:max-h-[165px] sm:max-h-[240px] md:max-h-[350px] overflow-hidden bg-neutral-100">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {safeBanners.map((slide, idx) => (
            <div
              key={slide.id || `banner-${idx}`}
              className="relative w-full h-full shrink-0 flex items-center justify-center cursor-pointer"
              onClick={() => onSlideClick && onSlideClick(slide, idx)}
            >
              <img
                src={slide.imageUrl || '/banner-default.svg'}
                alt={slide.title || `Habajaba Studio Banner ${idx + 1}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/banner-default.svg';
                }}
                className="w-full h-full object-cover"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows (Glassmorphic, subtle, non-intrusive) */}
        {safeBanners.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/70 hover:bg-white/95 text-[#171717] backdrop-blur-md flex items-center justify-center shadow-xs border border-white/60 transition-all opacity-70 hover:opacity-100 active:scale-95"
              title="Previous Banner"
              aria-label="Previous Banner"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#171717]" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/70 hover:bg-white/95 text-[#171717] backdrop-blur-md flex items-center justify-center shadow-xs border border-white/60 transition-all opacity-70 hover:opacity-100 active:scale-95"
              title="Next Banner"
              aria-label="Next Banner"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#171717]" />
            </button>
          </>
        )}

        {/* 4 Dot Indicators at the bottom */}
        {safeBanners.length > 1 && (
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/20">
            {safeBanners.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(dotIdx);
                }}
                className={`transition-all rounded-full ${
                  currentIndex === dotIdx
                    ? 'w-5 sm:w-6 h-1.5 bg-[#ED1025]'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
                aria-current={currentIndex === dotIdx ? 'true' : 'false'}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
