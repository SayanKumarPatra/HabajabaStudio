import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AlbumCarouselProps {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  children: React.ReactNode;
}

export const AlbumCarousel: React.FC<AlbumCarouselProps> = ({
  title,
  subtitle,
  onViewAll,
  children,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-3">
      {/* Header with Title and Scroll Controls */}
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-neutral-400 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-[#ED1025] hover:underline mr-2 py-1 px-2 cursor-pointer"
            >
              See All
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Scroll left"
              aria-label="Previous items"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Scroll right"
              aria-label="Next items"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex items-start gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {children}
      </div>
    </section>
  );
};
