import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Info,
  Radio,
  Loader2,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { CoverImage } from './CoverImage';

export const ExpandedPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    queue,
    queueIndex,
    playTrack,
    isExpanded,
    setIsExpanded,
    isLoading,
    error,
  } = useAudio();

  const { isFavorite, toggleFavorite } = useFavorites();
  const [showQueue, setShowQueue] = useState(false);

  if (!isExpanded || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex flex-col items-center justify-between p-4 md:p-8 animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded Player"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-[#ED1025]/15 via-transparent to-transparent pointer-events-none" />

      {/* Header bar: Title & Close Button */}
      <div className="relative z-10 w-full max-w-lg flex items-center justify-between text-white/90 pb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#ED1025] animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-bold text-white/70">
            Habajaba Studio LIVE
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(false)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close player"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Body: Artwork or Queue */}
      <div className="relative z-10 w-full max-w-md my-auto py-4">
        {!showQueue ? (
          <div className="flex flex-col items-center">
            {/* Large Album Artwork */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 transition-transform">
              <CoverImage
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                title={currentTrack.title}
                artist={currentTrack.artist}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Song Meta Lockup */}
            <div className="w-full mt-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight line-clamp-1">
                {currentTrack.title}
              </h2>
              <p className="text-sm sm:text-base text-white/70 mt-1 line-clamp-1 font-medium">
                {currentTrack.artist}
              </p>
              {currentTrack.album && (
                <div className="flex items-center justify-center gap-2 text-xs text-white/50 mt-1.5">
                  <span>{currentTrack.album}</span>
                  {currentTrack.genre && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{currentTrack.genre}</span>
                    </>
                  )}
                  {currentTrack.language && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{currentTrack.language}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Queue List View */
          <div className="w-full h-80 sm:h-96 bg-neutral-900/90 rounded-2xl border border-white/10 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-[#ED1025]" />
                Up Next ({queue.length} Tracks)
              </span>
              <button
                onClick={() => setShowQueue(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                Back to Art
              </button>
            </div>

            <div className="overflow-y-auto flex-1 mt-2 space-y-1.5 pr-1">
              {queue.map((track, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <button
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track, queue)}
                    className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                      isCurrent
                        ? 'bg-[#ED1025]/20 text-[#ED1025] font-semibold'
                        : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs font-mono tabular-nums text-white/40 w-4">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate">{track.title}</p>
                      <p className="text-[10px] text-white/50 truncate">{track.artist}</p>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold text-[#ED1025]">
                        Playing
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-[#ED1025]" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Panel */}
      <div className="relative z-10 w-full max-w-lg space-y-4 pt-2">
        {/* Progress Bar & Scrub */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1.5 bg-white/20 accent-[#ED1025] rounded-lg cursor-pointer"
            aria-label="Seek track position"
          />
          <div className="flex justify-between text-xs font-mono tabular-nums text-white/60">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport & Secondary Controls */}
        <div className="flex items-center justify-between px-2">
          {/* Shuffle Button */}
          <button
            onClick={toggleShuffle}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${
              isShuffle ? 'text-[#ED1025]' : 'text-white/60 hover:text-white'
            }`}
            title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
            aria-label="Toggle Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={playPrevious}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:text-[#ED1025] transition-colors"
            title="Previous track"
            aria-label="Previous track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Primary Play / Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white flex items-center justify-center shadow-lg shadow-[#ED1025]/40 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={playNext}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:text-[#ED1025] transition-colors"
            title="Next track"
            aria-label="Next track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Repeat Button */}
          <button
            onClick={cycleRepeat}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-[#ED1025]' : 'text-white/60 hover:text-white'
            }`}
            title={`Repeat mode: ${repeatMode}`}
            aria-label="Repeat mode"
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Lower Utility Bar: Favorite, Volume, Queue Toggle */}
        <div className="flex items-center justify-between pt-2 px-2 text-white/70 border-t border-white/10">
          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            className={`min-h-[44px] flex items-center gap-1.5 text-xs font-medium transition-colors ${
              isFavorite(currentTrack.id) ? 'text-[#ED1025]' : 'hover:text-white'
            }`}
            aria-label="Toggle Favorite"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite(currentTrack.id) ? 'fill-current' : ''}`}
            />
            <span>{isFavorite(currentTrack.id) ? 'Favorited' : 'Favorite'}</span>
          </button>

          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-white/70 hover:text-white"
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
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-18 sm:w-24 h-1 bg-white/20 accent-[#ED1025] rounded-lg cursor-pointer"
              aria-label="Volume slider"
            />
          </div>

          {/* Queue toggle */}
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`min-h-[44px] flex items-center gap-1.5 text-xs font-medium transition-colors ${
              showQueue ? 'text-[#ED1025]' : 'hover:text-white'
            }`}
            aria-label="View Queue"
          >
            <ListMusic className="w-5 h-5" />
            <span>Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
