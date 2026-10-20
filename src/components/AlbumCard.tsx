import React, { useState } from 'react';
import { Play, Pause, Share2, Check } from 'lucide-react';
import { Album } from '../types/music';
import { useAudio } from '../context/AudioContext';
import { MusicService } from '../services/musicService';
import { CoverImage } from './CoverImage';
import { shareAlbum } from '../utils/share';
import { triggerHaptic } from '../utils/haptics';

interface AlbumCardProps {
  album: Album;
  onSelect: (album: Album) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  onSelect,
  size = 'md',
}) => {
  const { currentTrack, isPlaying, togglePlay, playQueue } = useAudio();
  const [isShared, setIsShared] = useState(false);

  const albumTracks = MusicService.getAlbumTracks(album);
  const isThisAlbumPlaying =
    isPlaying && albumTracks.some((t) => t.id === currentTrack?.id);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const res = await shareAlbum(album);
    if (res.success) {
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2200);
    }
  };

  const handlePlayDirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isThisAlbumPlaying) {
      togglePlay();
    } else if (albumTracks.length > 0) {
      playQueue(albumTracks, 0);
    }
  };

  const widthClasses = {
    sm: 'w-36 sm:w-40',
    md: 'w-44 sm:w-48',
    lg: 'w-52 sm:w-56',
  };

  return (
    <div
      onClick={() => onSelect(album)}
      className={`album-card group shrink-0 cursor-pointer flex flex-col select-none transition-transform active:scale-[0.98] ${widthClasses[size]}`}
    >
      {/* Artwork Box */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-md group-hover:border-[#ED1025]/40 transition-all">
        <CoverImage
          src={album.coverUrl}
          alt={album.title}
          title={album.title}
          artist={album.artist}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Floating Quick Share Button in top-right - Always Visible */}
        <button
          type="button"
          onClick={handleShare}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md border transition-all cursor-pointer flex items-center justify-center active:scale-90 z-10 ${
            isShared
              ? 'bg-emerald-500/90 text-white border-emerald-400 opacity-100 scale-100 shadow-md'
              : 'bg-black/75 hover:bg-black/90 text-white border-white/25 hover:border-white/40 opacity-100 shadow-sm'
          }`}
          title={isShared ? 'অ্যালবাম লিঙ্ক শেয়ার করা হয়েছে!' : 'অ্যালবাম শেয়ার করুন'}
          aria-label={`Share ${album.title}`}
        >
          {isShared ? (
            <Check className="w-3.5 h-3.5 text-white" />
          ) : (
            <Share2 className="w-3.5 h-3.5 text-white" />
          )}
        </button>

        {/* Floating Quick Play Action Button */}
        <button
          onClick={handlePlayDirect}
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white flex items-center justify-center shadow-lg shadow-[#ED1025]/30 transition-all cursor-pointer ${
            isThisAlbumPlaying
              ? 'opacity-100 scale-100'
              : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'
          }`}
          title={isThisAlbumPlaying ? 'Pause album' : 'Play album'}
          aria-label={isThisAlbumPlaying ? 'Pause album' : 'Play album'}
        >
          {isThisAlbumPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          )}
        </button>
      </div>

      {/* Metadata (clean, unboxed) */}
      <div className="mt-2.5 px-0.5">
        <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#ED1025] transition-colors truncate">
          {album.title}
        </h4>
        <p className="text-[11px] sm:text-xs text-neutral-400 truncate mt-0.5">
          {album.artist}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]/80 mt-1">
          <span>{album.trackIds.length} Tracks</span>
          {album.genre && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{album.genre}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
