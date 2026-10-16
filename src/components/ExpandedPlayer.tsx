import React, { useEffect } from 'react';
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
  Radio,
  Loader2,
  Clock,
  Info,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { CassetteTape } from './CassetteTape';

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
    isExpanded,
    setIsExpanded,
    isLoading,
    error,
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

  // 20 Vibrant RGB Neon colors for dynamic dancing music beats
  const rgbBeats = [
    { color: 'from-[#FF0055] to-[#FF5577]', shadow: 'rgba(255,0,85,0.7)', baseH: 22 },
    { color: 'from-[#FF3366] to-[#FF7799]', shadow: 'rgba(255,51,102,0.7)', baseH: 14 },
    { color: 'from-[#EC4899] to-[#F472B6]', shadow: 'rgba(236,72,153,0.7)', baseH: 28 },
    { color: 'from-[#D946EF] to-[#E879F9]', shadow: 'rgba(217,70,239,0.7)', baseH: 18 },
    { color: 'from-[#A855F7] to-[#C084FC]', shadow: 'rgba(168,85,247,0.7)', baseH: 32 },
    { color: 'from-[#8B5CF6] to-[#A78BFA]', shadow: 'rgba(139,92,246,0.7)', baseH: 24 },
    { color: 'from-[#6366F1] to-[#818CF8]', shadow: 'rgba(99,102,241,0.7)', baseH: 16 },
    { color: 'from-[#3B82F6] to-[#60A5FA]', shadow: 'rgba(59,130,246,0.7)', baseH: 30 },
    { color: 'from-[#06B6D4] to-[#22D3EE]', shadow: 'rgba(6,182,212,0.7)', baseH: 26 },
    { color: 'from-[#14B8A6] to-[#2DD4BF]', shadow: 'rgba(20,184,166,0.7)', baseH: 19 },
    { color: 'from-[#10B981] to-[#34D399]', shadow: 'rgba(16,185,129,0.7)', baseH: 34 },
    { color: 'from-[#84CC16] to-[#A3E635]', shadow: 'rgba(132,204,22,0.7)', baseH: 20 },
    { color: 'from-[#EAB308] to-[#FACC15]', shadow: 'rgba(234,179,8,0.7)', baseH: 27 },
    { color: 'from-[#F59E0B] to-[#FBBF24]', shadow: 'rgba(245,158,11,0.7)', baseH: 15 },
    { color: 'from-[#F97316] to-[#FB923C]', shadow: 'rgba(249,115,22,0.7)', baseH: 31 },
    { color: 'from-[#EF4444] to-[#F87171]', shadow: 'rgba(239,68,68,0.7)', baseH: 23 },
    { color: 'from-[#EC4899] to-[#F43F5E]', shadow: 'rgba(236,72,153,0.7)', baseH: 17 },
    { color: 'from-[#A855F7] to-[#D946EF]', shadow: 'rgba(168,85,247,0.7)', baseH: 29 },
    { color: 'from-[#06B6D4] to-[#3B82F6]', shadow: 'rgba(6,182,212,0.7)', baseH: 21 },
    { color: 'from-[#FF0055] to-[#F59E0B]', shadow: 'rgba(255,0,85,0.7)', baseH: 25 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0B0E]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-5 md:p-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Habajaba Live Cassette Player"
    >
      {/* Background Animated Dynamic Ambient Glow that responds to music */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full pointer-events-none transition-all duration-1000 ${
          isPlaying
            ? 'bg-radial from-[#ED1025]/30 via-purple-600/15 to-transparent blur-3xl scale-110 opacity-90 animate-pulse'
            : 'bg-radial from-[#ED1025]/10 via-transparent to-transparent blur-3xl scale-90 opacity-30'
        }`}
      />

      {/* Clean Minimal Header (Top Review/q4 Section Clutter Removed per instruction) */}
      <div className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between text-white/90 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ED1025] animate-ping" />
          <Radio className="w-4 h-4 text-[#ED1025]" />
          <span className="text-[11px] sm:text-xs uppercase tracking-widest font-black text-white/90 font-mono">
            HABAJABA CASSETTE DECK
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(false)}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close player"
          aria-label="Close"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Main Center Content: Vintage Double-Spool Cassette & Song Metadata */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-2 flex flex-col items-center justify-center space-y-3 sm:space-y-4">
        {/* Retro Double-Spool Rotating Cassette Tape */}
        <CassetteTape track={currentTrack} isPlaying={isPlaying} />

        {/* Song & Artist Title */}
        <div className="w-full text-center flex flex-col items-center justify-center px-2">
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight line-clamp-1 w-full drop-shadow-md">
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
        </div>

        {/* Dancing RGB Neon Music Beats Visualizer (বিভিন্ন আরজিবি কালারের মিউজিক বিডস) */}
        <div className="w-full flex flex-col items-center gap-1.5 pt-1">
          <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-10 px-3 py-1 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 shadow-inner w-full">
            {rgbBeats.map((beat, i) => {
              // Calculate animated dancing height based on playback state and index
              const multiplier = isPlaying
                ? 0.4 + Math.sin(currentTime * 4 + i * 0.8) * 0.35 + (i % 2 === 0 ? 0.25 : 0.1)
                : 0.15;
              const calcHeight = isPlaying
                ? Math.max(6, Math.min(36, beat.baseH * multiplier * 1.5))
                : 4;

              return (
                <div
                  key={i}
                  className={`w-1 sm:w-1.5 rounded-full bg-gradient-to-t ${beat.color} transition-all`}
                  style={{
                    height: `${calcHeight}px`,
                    transition: isPlaying ? 'height 120ms ease-in-out' : 'height 400ms ease',
                    boxShadow: isPlaying ? `0 0 8px ${beat.shadow}` : 'none',
                  }}
                />
              );
            })}
          </div>
          <span className="text-[9px] font-mono tracking-widest uppercase text-white/40">
            {isPlaying ? 'DYNAMIC RGB EQUALIZER ACTIVE' : 'AUDIO PAUSED'}
          </span>
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
      <div className="relative z-10 w-full max-w-md mx-auto space-y-3 pt-1 flex flex-col items-center justify-center">
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
