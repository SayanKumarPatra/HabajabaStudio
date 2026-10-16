import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Maximize2,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { CoverImage } from './CoverImage';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    isLoading,
    error,
    setIsExpanded,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    clearError,
  } = useAudio();

  const { isFavorite, toggleFavorite } = useFavorites();

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    if (duration > 0) {
      seek(ratio * duration);
    }
  };

  return (
    <div
      className="fixed z-40 left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-0 bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
      role="region"
      aria-label="Audio Player"
    >
      {/* Top thin interactive progress scrubber */}
      <div
        className="w-full h-1.5 bg-neutral-100 hover:h-2 cursor-pointer transition-all group relative"
        onClick={handleProgressBarClick}
        title="Seek position"
      >
        <div
          className="h-full bg-[#ED1025] relative transition-all"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#ED1025] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" />
        </div>
      </div>

      {/* Error alert toast if link fails */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ED1025]" />
            <span className="line-clamp-1">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-700 font-semibold hover:underline ml-2 whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main player controls container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-18 flex items-center justify-between gap-3">
        {/* Left: Thumbnail & Song Metadata */}
        <div className="flex items-center gap-3 min-w-0 max-w-[45%] md:max-w-[30%]">
          <button
            onClick={() => setIsExpanded(true)}
            className="relative shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-lg overflow-hidden group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ED1025]"
            title="Expand player"
          >
            <CoverImage
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              title={currentTrack.title}
              artist={currentTrack.artist}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Maximize2 className="w-4 h-4" />
            </div>
          </button>

          <div
            onClick={() => setIsExpanded(true)}
            className="cursor-pointer min-w-0 truncate"
            title="Click to view player"
          >
            <h4 className="text-xs md:text-sm font-semibold text-[#171717] truncate leading-tight hover:text-[#ED1025] transition-colors">
              {currentTrack.title}
            </h4>
            <p className="text-[11px] md:text-xs text-[#6B7280] truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          {/* Quick Favorite Toggle */}
          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            className={`min-h-[44px] min-w-[44px] hidden sm:flex items-center justify-center rounded-full transition-colors shrink-0 ${
              isFavorite(currentTrack.id)
                ? 'text-[#ED1025]'
                : 'text-[#6B7280] hover:text-[#171717]'
            }`}
            title={isFavorite(currentTrack.id) ? 'Remove favorite' : 'Add to favorites'}
            aria-label="Toggle Favorite"
          >
            <Heart
              className={`w-4 h-4 ${isFavorite(currentTrack.id) ? 'fill-current' : ''}`}
            />
          </button>
        </div>

        {/* Center: Playback Controls & Timers */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1 md:gap-3">
            <button
              onClick={playPrevious}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#171717] hover:text-[#ED1025] rounded-full transition-colors"
              title="Previous song"
              aria-label="Previous"
            >
              <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white flex items-center justify-center shadow-md shadow-[#ED1025]/30 active:scale-95 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#171717] hover:text-[#ED1025] rounded-full transition-colors"
              title="Next song"
              aria-label="Next"
            >
              <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            </button>
          </div>

          {/* Time indicator */}
          <div className="hidden md:flex items-center gap-1 text-[11px] font-mono tabular-nums text-[#6B7280]">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Expand Action */}
        <div className="flex items-center gap-2 justify-end min-w-[120px]">
          {/* Desktop Volume control */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-[#6B7280] hover:text-[#171717] transition-colors p-1"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label="Mute toggle"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#ED1025]" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-18 h-1 bg-neutral-200 accent-[#ED1025] rounded-lg cursor-pointer"
              aria-label="Volume slider"
            />
          </div>

          {/* Expand Full Player Button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="min-h-[44px] px-3 flex items-center gap-1.5 text-xs font-medium text-[#171717] hover:bg-neutral-100 rounded-lg transition-colors"
            title="Expand full player"
            aria-label="Expand player"
          >
            <Maximize2 className="w-4 h-4 text-[#ED1025]" />
            <span className="hidden sm:inline">Expanded</span>
          </button>
        </div>
      </div>
    </div>
  );
};
