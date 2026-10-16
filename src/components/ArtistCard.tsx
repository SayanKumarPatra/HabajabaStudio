import React, { useState } from 'react';
import { Mic2 } from 'lucide-react';
import { Artist } from '../types/music';

interface ArtistCardProps {
  artist: Artist;
  onSelect: (artist: Artist) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelect }) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div
      onClick={() => onSelect(artist)}
      className="group flex flex-col items-center text-center p-3 rounded-2xl cursor-pointer hover:bg-neutral-50 border border-transparent hover:border-[#EAEAEA] transition-all select-none"
    >
      {/* Circle Avatar */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-neutral-100 border-2 border-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all mb-3">
        {!hasError && artist.avatarUrl ? (
          <img
            src={artist.avatarUrl}
            alt={artist.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-neutral-900 to-neutral-700 flex flex-col items-center justify-center text-white">
            <Mic2 className="w-6 h-6 text-[#ED1025] mb-1" />
            <span className="text-xs font-bold tracking-wider">
              {getInitials(artist.name)}
            </span>
          </div>
        )}
      </div>

      {/* Name & Details */}
      <h4 className="text-sm font-bold text-[#171717] group-hover:text-[#ED1025] transition-colors truncate max-w-full">
        {artist.name}
      </h4>
      <p className="text-xs text-[#6B7280] line-clamp-1 mt-0.5">
        {artist.role}
      </p>
      {artist.trackCount !== undefined && artist.trackCount > 0 && (
        <span className="text-[11px] font-mono tabular-nums text-[#ED1025] font-medium mt-1">
          {artist.trackCount} {artist.trackCount === 1 ? 'Track' : 'Tracks'}
        </span>
      )}
    </div>
  );
};
