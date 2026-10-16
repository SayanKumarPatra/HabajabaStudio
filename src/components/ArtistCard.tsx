import React, { useState, useEffect } from 'react';
import { Mic2 } from 'lucide-react';
import { Artist } from '../types/music';
import { offlineCacheService } from '../services/offlineCacheService';

interface ArtistCardProps {
  artist: Artist;
  onSelect: (artist: Artist) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelect }) => {
  const [hasError, setHasError] = useState(false);
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    let isMounted = true;
    if (artist.avatarUrl && artist.avatarUrl.startsWith('http')) {
      offlineCacheService.getCachedImage(artist.avatarUrl).then((cached) => {
        if (isMounted && cached) {
          setCachedUrl(cached);
        } else if (isMounted && navigator.onLine) {
          // Pre-cache artist avatar in background
          offlineCacheService.getOrCacheImage(artist.avatarUrl).then((newCached) => {
            if (isMounted && newCached) {
              setCachedUrl(newCached);
            }
          });
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [artist.avatarUrl]);

  const activeSrc = cachedUrl || artist.avatarUrl;

  const handleImageError = () => {
    if (cachedUrl) return;
    if (artist.avatarUrl) {
      offlineCacheService.getCachedImage(artist.avatarUrl).then((cached) => {
        if (cached) {
          setCachedUrl(cached);
          setHasError(false);
        } else {
          setHasError(true);
        }
      });
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      onClick={() => onSelect(artist)}
      className="group flex flex-col items-center text-center p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl cursor-pointer hover:bg-neutral-50/80 border border-transparent hover:border-[#EAEAEA] transition-all select-none active:scale-95"
    >
      {/* Circle Avatar */}
      <div className="relative w-16 h-16 sm:w-22 sm:h-22 md:w-26 md:h-26 rounded-full overflow-hidden bg-neutral-100 border-2 border-white shadow-xs group-hover:shadow-md group-hover:scale-105 transition-all mb-1.5 sm:mb-2 shrink-0">
        {!hasError && activeSrc ? (
          <img
            src={activeSrc}
            alt={artist.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-neutral-900 to-neutral-700 flex flex-col items-center justify-center text-white">
            <Mic2 className="w-4 h-4 sm:w-6 sm:h-6 text-[#ED1025] mb-0.5" />
            <span className="text-[10px] sm:text-xs font-bold tracking-wider">
              {getInitials(artist.name)}
            </span>
          </div>
        )}
      </div>

      {/* Name & Details */}
      <h4 className="text-xs sm:text-sm font-bold text-[#171717] group-hover:text-[#ED1025] transition-colors truncate max-w-full leading-tight">
        {artist.name}
      </h4>
      <p className="text-[10px] sm:text-xs text-[#6B7280] line-clamp-1 mt-0.5 font-medium">
        {artist.role}
      </p>
      {artist.trackCount !== undefined && artist.trackCount > 0 && (
        <span className="text-[9px] sm:text-[11px] font-mono tabular-nums text-[#ED1025] font-semibold mt-0.5">
          {artist.trackCount} {artist.trackCount === 1 ? 'Track' : 'Tracks'}
        </span>
      )}
    </div>
  );
};
