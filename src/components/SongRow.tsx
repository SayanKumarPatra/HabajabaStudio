import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  Share2,
  Check,
} from 'lucide-react';
import { Track } from '../types/music';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { CoverImage } from './CoverImage';
import { shareTrack } from '../utils/share';
import { triggerHaptic } from '../utils/haptics';

interface SongRowProps {
  track: Track;
  index?: number;
  playlistContext?: Track[];
  onOpenAlbum?: (albumTitle: string) => void;
  onOpenArtist?: (artistName: string) => void;
}

export const SongRow: React.FC<SongRowProps> = ({
  track,
  index,
  playlistContext,
  onOpenArtist,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudio();
  const { favorites, toggleFavorite } = useFavorites();
  const [isShared, setIsShared] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isRowPlaying = isCurrent && isPlaying;
  const isFav = favorites.includes(track.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContext || [track]);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const result = await shareTrack(track);
    if (result.success) {
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2200);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer border ${
        isCurrent
          ? 'bg-[#ED1025]/20 border-[#ED1025]/40 shadow-xs'
          : 'hover:bg-white/[0.08] border-transparent hover:border-white/10'
      }`}
    >
      {/* Left: Index / Play Icon & Thumbnail & Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Optional numeric index or play state */}
        {index !== undefined && (
          <span className="w-5 text-center text-xs font-mono tabular-nums text-neutral-400 hidden sm:inline-block">
            {isRowPlaying ? (
              <span className="text-[#ED1025] font-bold">▶</span>
            ) : (
              index + 1
            )}
          </span>
        )}

        {/* 16:9 YouTube Aspect Ratio Thumbnail with overlay play trigger */}
        <div className="relative w-16 sm:w-20 aspect-video rounded-lg overflow-hidden shrink-0 shadow-xs border border-white/10">
          <CoverImage
            src={track.coverUrl}
            alt={track.title}
            title={track.title}
            artist={track.artist}
            aspectRatio="video"
            className="w-full h-full object-cover"
          />
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isRowPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isRowPlaying ? (
              <Pause className="w-4 h-4 text-white fill-current" />
            ) : (
              <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
            )}
          </div>
        </div>

        {/* Title and Artist */}
        <div className="min-w-0 flex-1 pr-2">
          <h4
            className={`text-xs sm:text-sm font-semibold truncate leading-tight ${
              isCurrent ? 'text-[#ED1025]' : 'text-neutral-100 group-hover:text-white'
            }`}
          >
            {track.title}
          </h4>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-neutral-400 mt-0.5 truncate">
            <span
              onClick={(e) => {
                if (onOpenArtist) {
                  e.stopPropagation();
                  onOpenArtist(track.artist);
                }
              }}
              className="hover:underline hover:text-white truncate"
            >
              {track.artist}
            </span>
            {track.genre && (
              <>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="hidden xs:inline text-neutral-400">{track.genre}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Duration, Favorite Heart, Share Button (Always visibly shown, no three dots) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Duration */}
        <span className="text-[11px] sm:text-xs font-mono tabular-nums text-neutral-400 mr-1 sm:mr-1.5 hidden xs:inline-block">
          {track.duration || '--:--'}
        </span>

        {/* Favorite heart button - Always Visibly Present Without Needing Touch/Hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('selection');
            toggleFavorite(track.id);
          }}
          className={`w-9 h-9 sm:w-9.5 sm:h-9.5 flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-90 ${
            isFav
              ? 'text-white bg-[#ED1025] border border-[#ED1025] shadow-xs shadow-[#ED1025]/40'
              : 'text-neutral-100 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30'
          }`}
          title={isFav ? 'পছন্দের তালিকা থেকে বাদ দিন' : 'পছন্দের তালিকায় যুক্ত করুন'}
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isFav ? 'fill-current text-white' : 'stroke-[2] text-neutral-100'}`} />
        </button>

        {/* Dedicated Web Share API Button - Always Visibly Present Without Needing Touch/Hover */}
        <button
          type="button"
          onClick={handleShare}
          className={`w-9 h-9 sm:w-9.5 sm:h-9.5 flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-90 ${
            isShared
              ? 'text-emerald-300 bg-emerald-500/25 border border-emerald-400/50 shadow-xs shadow-emerald-500/30'
              : 'text-neutral-100 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30'
          }`}
          title={isShared ? 'লিঙ্ক শেয়ার করা হয়েছে!' : 'গান শেয়ার করুন'}
          aria-label={`Share ${track.title}`}
        >
          {isShared ? (
            <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-400 animate-bounce" />
          ) : (
            <Share2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-neutral-100" />
          )}
        </button>
      </div>
    </div>
  );
};
