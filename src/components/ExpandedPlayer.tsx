import React, { useEffect, useState } from 'react';
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
  Disc3,
  Loader2,
  Clock,
  Info,
  Youtube,
  Share2,
  Check,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { VinylDiscPlayer } from './VinylDiscPlayer';
import { shareTrack } from '../utils/share';
import { triggerHaptic } from '../utils/haptics';

export const ExpandedPlayer: React.FC = () => {
  const [isShared, setIsShared] = useState(false);
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
    isExpanded,
    setIsExpanded,
    isLoading,
    error,
    isYouTubeTrack,
  } = useAudio();

  const { isFavorite, toggleFavorite } = useFavorites();

  // Handle popstate so browser/mobile back button gracefully closes the player drawer
  useEffect(() => {
    if (!isExpanded) return;

    const handlePopState = () => {
      setIsExpanded(false);
    };

    window.history.pushState({ modal: 'expanded-player' }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isExpanded, setIsExpanded]);

  if (!isExpanded || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const remainingSecs = Math.max(0, duration - currentTime);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0B0E]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3.5 sm:p-5 md:p-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Habajaba Live Player"
    >
      {/* Background Animated Dynamic Ambient Glow that responds to music */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full pointer-events-none transition-all duration-1000 ${
          isPlaying
            ? 'bg-radial from-[#ED1025]/30 via-amber-500/15 to-transparent blur-3xl scale-110 opacity-90 animate-pulse'
            : 'bg-radial from-[#ED1025]/10 via-transparent to-transparent blur-3xl scale-90 opacity-30'
        }`}
      />

      {/* Clean Minimal Header without Clutter */}
      <div className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between text-white/90 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ED1025] animate-ping" />
          <Disc3 className={`w-4 h-4 text-[#ED1025] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span className="text-[11px] sm:text-xs uppercase tracking-widest font-black text-white/90 font-mono">
            HABAJABA STUDIO LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Share Track */}
          <button
            onClick={async () => {
              triggerHaptic('light');
              const res = await shareTrack(currentTrack);
              if (res.success) {
                setIsShared(true);
                setTimeout(() => setIsShared(false), 2200);
              }
            }}
            className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 ${
              isShared
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title="Share this track (Web Share)"
            aria-label={`Share ${currentTrack.title}`}
          >
            {isShared ? (
              <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setIsExpanded(false)}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close player"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Content: Single Rotating Round Vinyl Disc & Song Metadata */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-3 flex flex-col items-center justify-center space-y-4">
        {/* Completely Round Rotating Disc with Song Cover Image Inside */}
        <VinylDiscPlayer track={currentTrack} isPlaying={isPlaying} />

        {/* Song & Artist Title */}
        <div className="w-full text-center flex flex-col items-center justify-center px-2 pt-1">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight line-clamp-1 w-full drop-shadow-md">
            {currentTrack.title}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-[#ED1025] mt-0.5 line-clamp-1 w-full">
            {currentTrack.artist}
          </p>
          {currentTrack.album && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-white/60 mt-1 font-medium">
              <span>{currentTrack.album}</span>
              {currentTrack.genre && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-semibold">{currentTrack.genre}</span>
                </>
              )}
            </div>
          )}

          {isYouTubeTrack && (
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-600/20 text-red-300 border border-red-500/30">
                <Youtube className="w-3 h-3 text-[#ED1025]" />
                <span>YouTube Audio Stream</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bengali">
                <span>স্ক্রীন অফ প্লে সক্রিয়</span>
              </span>
            </div>
          )}
        </div>

        {/* Error notification if playback failed */}
        {error && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2 w-full">
            <Info className="w-4 h-4 shrink-0 text-[#ED1025]" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Running Minutes & Player Progress Controls Panel */}
      <div className="relative z-10 w-full max-w-md mx-auto space-y-3 pt-2 flex flex-col items-center justify-center">
        {/* Running Minutes Pill Display */}
        <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-inner">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[#ED1025]">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              {isPlaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ED1025] animate-ping" />
              )}
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-base sm:text-lg font-black tracking-wider text-white drop-shadow-[0_0_8px_rgba(237,16,37,0.6)]">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs text-white/40">/</span>
              <span className="text-xs text-white/60 font-semibold">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ED1025]/20 text-[#ED1025] border border-[#ED1025]/30 font-bold">
              {Math.round(progressPercent)}%
            </span>
            <span className="text-[10px] font-mono text-white/50 hidden xs:inline">
              -{formatTime(remainingSecs)}
            </span>
          </div>
        </div>

        {/* Glowing Illuminated Progress Slider */}
        <div className="w-full space-y-1 px-1">
          <div className="relative w-full flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-2 bg-white/15 accent-[#ED1025] rounded-lg cursor-pointer"
              aria-label="Seek track position"
              style={{
                background: `linear-gradient(to right, #ED1025 0%, #FF9900 ${progressPercent}%, rgba(255,255,255,0.15) ${progressPercent}%, rgba(255,255,255,0.15) 100%)`,
              }}
            />
          </div>
        </div>

        {/* Transport Controls (Centered 5-col Grid) */}
        <div className="w-full grid grid-cols-5 items-center justify-items-center px-1">
          {/* Shuffle Button */}
          <button
            onClick={toggleShuffle}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
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
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:text-[#ED1025] transition-colors cursor-pointer"
            title="Previous track"
            aria-label="Previous track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Primary Play / Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#ED1025] to-[#FF3B30] hover:brightness-110 text-white flex items-center justify-center shadow-lg shadow-[#ED1025]/50 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={playNext}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:text-[#ED1025] transition-colors cursor-pointer"
            title="Next track"
            aria-label="Next track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Repeat Button */}
          <button
            onClick={cycleRepeat}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
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

        {/* Lower Utility Bar: Favorite Heart & Volume */}
        <div className="w-full flex items-center justify-between pt-2 px-3 text-white/70 border-t border-white/10 text-xs">
          {/* Favorite Toggle */}
          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isFavorite(currentTrack.id) ? 'text-[#ED1025]' : 'text-white/60 hover:text-white'
            }`}
            aria-label="Toggle Favorite"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite(currentTrack.id) ? 'fill-current text-[#ED1025]' : ''
              }`}
            />
            <span className="font-medium text-[11px]">
              {isFavorite(currentTrack.id) ? 'Favorited' : 'Add to Favorites'}
            </span>
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
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
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                if (isMuted && val > 0) toggleMute();
              }}
              className="w-18 sm:w-24 h-1.5 bg-white/20 accent-[#ED1025] rounded-lg cursor-pointer"
              aria-label="Volume slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
