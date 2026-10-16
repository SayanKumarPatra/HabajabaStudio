import React, { useState, useEffect } from 'react';
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
  Disc3,
  FileText,
  Sparkles,
  Music2,
  Clock,
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
  const [activeTab, setActiveTab] = useState<'visuals' | 'review' | 'queue'>('visuals');

  // Push history state when expanded so device/mobile back button closes player instead of exiting website
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

  // 14 dynamic equalizer bars height distribution for visual appeal
  const waveHeights = [40, 75, 55, 95, 60, 100, 70, 85, 45, 90, 65, 80, 50, 75];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-2xl flex flex-col items-center justify-between p-3.5 sm:p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded Music Player & Review"
    >
      {/* Background Animated Dynamic Ambient Glow that responds to music */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[480px] h-[320px] sm:h-[480px] rounded-full pointer-events-none transition-all duration-1000 ${
          isPlaying
            ? 'bg-radial from-[#ED1025]/35 via-amber-500/20 to-transparent blur-3xl scale-110 opacity-90 animate-pulse'
            : 'bg-radial from-[#ED1025]/15 via-transparent to-transparent blur-3xl scale-90 opacity-40'
        }`}
      />

      {/* Header bar: Studio Pill, Tab Switcher & Close Button */}
      <div className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between text-white/90 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ED1025] animate-ping" />
          <Radio className="w-4 h-4 text-[#ED1025]" />
          <span className="text-[11px] sm:text-xs uppercase tracking-widest font-black text-white/80 font-mono">
            HABAJABA LIVE
          </span>
        </div>

        {/* View Switcher: Visuals / Review / Queue */}
        <div className="flex items-center p-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-semibold">
          <button
            onClick={() => setActiveTab('visuals')}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'visuals'
                ? 'bg-[#ED1025] text-white shadow-xs font-bold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            অডিও
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'review'
                ? 'bg-[#ED1025] text-white shadow-xs font-bold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            মিউজিক রিভিউ
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-[#ED1025] text-white shadow-xs font-bold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            কিউ ({queue.length})
          </button>
        </div>

        <button
          onClick={() => setIsExpanded(false)}
          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close player"
          aria-label="Close"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Main Center Content Body based on Active Tab */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-2 flex flex-col items-center justify-center flex-1">
        {/* TAB 1: Visuals & Live Acoustic Audio Experience */}
        {activeTab === 'visuals' && (
          <div className="w-full flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4">
            {/* Album Artwork with Glowing Vinyl Edge */}
            <div className="relative group">
              {/* Outer Radiant Glow */}
              <div
                className={`absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#ED1025] via-amber-400 to-[#ED1025] opacity-40 blur-xl transition-all duration-700 ${
                  isPlaying ? 'scale-105 opacity-60' : 'scale-95 opacity-20'
                }`}
              />

              <div className="relative w-56 h-56 sm:w-68 sm:h-68 mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-white/20 transition-transform flex items-center justify-center bg-neutral-900">
                <CoverImage
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  title={currentTrack.title}
                  artist={currentTrack.artist}
                  className="w-full h-full object-cover"
                />

                {/* Disc badge overlay */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-mono text-white/90 flex items-center gap-1">
                  <Disc3
                    className={`w-3 h-3 text-[#ED1025] ${isPlaying ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '4s' }}
                  />
                  <span>STUDIO MASTER</span>
                </div>
              </div>
            </div>

            {/* Song Metadata */}
            <div className="w-full text-center flex flex-col items-center justify-center px-2">
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight line-clamp-1 w-full text-shadow">
                {currentTrack.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5 line-clamp-1 font-semibold text-[#ED1025] w-full">
                {currentTrack.artist}
              </p>
              {currentTrack.album && (
                <div className="flex items-center justify-center gap-2 text-[11px] text-white/50 mt-1">
                  <span>{currentTrack.album}</span>
                  {currentTrack.genre && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-400/90 font-medium">{currentTrack.genre}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Soundwave Equalizer Bars that bounce with playback */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-7 px-3 py-1 rounded-full bg-white/5 backdrop-blur-xs border border-white/10">
              {waveHeights.map((h, i) => (
                <div
                  key={i}
                  className={`w-1 sm:w-1.5 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? 'bg-gradient-to-t from-[#ED1025] via-amber-400 to-white'
                      : 'bg-white/25 h-1.5'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(6, Math.min(26, (h * (0.4 + (i % 3) * 0.3))))}px` : '4px',
                    transition: 'height 250ms ease-in-out',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Music Review & Story Tab ("মিউজিক রিভিউ") */}
        {activeTab === 'review' && (
          <div className="w-full h-80 sm:h-96 bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-white/15 p-4 sm:p-5 flex flex-col overflow-y-auto space-y-3.5 text-left text-white animate-in fade-in">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ED1025]" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  মিউজিক রিভিউ ও প্রোডাকশন ডিটেইলস
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ED1025]/20 text-[#ED1025] font-bold">
                Acoustic Master
              </span>
            </div>

            {/* Song Title & Artist Summary */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white">{currentTrack.title}</h3>
              <p className="text-xs text-amber-400 font-semibold">{currentTrack.artist}</p>
              {currentTrack.album && (
                <p className="text-[11px] text-white/60">অ্যালবাম: {currentTrack.album}</p>
              )}
            </div>

            {/* Description / Story / Review */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-[#ED1025] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>স্টুডিও অডিও রিভিউ ও বিবরণ (Master Review)</span>
              </h4>
              <p className="text-xs text-white/80 leading-relaxed font-bengali bg-black/40 p-3 rounded-xl border border-white/5">
                {currentTrack.description ||
                  'হ্যাবাজ্যাবা স্টুডিও লাইভ (Habajaba Studio LIVE)-এর অরিজিনাল অ্যাকোস্টিক সেশনে রেকর্ডকৃত হাই-ফিডেলিটি বাংলা গান। ড্রপবক্স ডিরেক্ট ডিজিটাল স্ট্রিমিং ও স্টুডিও মাস্টার কোয়ালিটি দ্বারা সমৃদ্ধ।'}
              </p>
            </div>

            {/* Lyrics if available */}
            {currentTrack.lyrics && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5" />
                  <span>গানের কথা (Lyrics)</span>
                </h4>
                <div className="text-xs text-white/80 whitespace-pre-line font-bengali bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed">
                  {currentTrack.lyrics}
                </div>
              </div>
            )}

            {/* Technical Audio Specs */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/70 pt-1">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-white/40 block">DURATION</span>
                <span className="text-white font-bold">{formatTime(duration)}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-white/40 block">AUDIO STREAM</span>
                <span className="text-emerald-400 font-bold">24-Bit Acoustic Master</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Queue List Tab */}
        {activeTab === 'queue' && (
          <div className="w-full h-80 sm:h-96 bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-white/15 p-4 flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-[#ED1025]" />
                প্লেলিস্ট কিউ ({queue.length} Tracks)
              </span>
              <button
                onClick={() => setActiveTab('visuals')}
                className="text-xs text-white/60 hover:text-white"
              >
                আর্টওয়ার্কে ফিরুন
              </button>
            </div>

            <div className="overflow-y-auto flex-1 mt-2 space-y-1.5 pr-1">
              {queue.map((track, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <button
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track, queue)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#ED1025]/25 border border-[#ED1025]/40 text-white font-semibold'
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
                      <span className="text-[10px] uppercase font-bold text-[#ED1025] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ED1025] animate-ping" />
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
          <div className="mt-2 p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2 w-full">
            <Info className="w-4 h-4 shrink-0 text-[#ED1025]" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Eye-Catching Running Minutes & Progress Controls Panel */}
      <div className="relative z-10 w-full max-w-md mx-auto space-y-3 pt-2 flex flex-col items-center justify-center">
        {/* Running Minutes Pill Display ("যে মিনিটটা চলছে যেন সুন্দর দেখায় মানুষের চোখে লাগে") */}
        <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-inner">
          {/* Running Clock with Pulsing Indicator */}
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

          {/* Completion Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ED1025]/20 text-[#ED1025] border border-[#ED1025]/30 font-bold">
              {Math.round(progressPercent)}%
            </span>
            <span className="text-[10px] font-mono text-white/50 hidden xs:inline">
              -{formatTime(remainingSecs)} বাকি
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

        {/* Transport & Secondary Controls - Dead Centered using 5-col Grid */}
        <div className="w-full grid grid-cols-5 items-center justify-items-center px-1">
          {/* Shuffle Button (Col 1) */}
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

          {/* Previous Track (Col 2) */}
          <button
            onClick={playPrevious}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:text-[#ED1025] transition-colors cursor-pointer"
            title="Previous track"
            aria-label="Previous track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Primary Play / Pause Button (Col 3 - Dead Center) */}
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

          {/* Next Track (Col 4) */}
          <button
            onClick={playNext}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:text-[#ED1025] transition-colors cursor-pointer"
            title="Next track"
            aria-label="Next track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Repeat Button (Col 5) */}
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

        {/* Lower Utility Bar: Favorite, Volume, Queue Toggle - Centered 3-col Grid */}
        <div className="w-full grid grid-cols-3 items-center justify-items-center pt-2 px-1 text-white/70 border-t border-white/10">
          {/* Favorite (Col 1) */}
          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            className={`min-h-[40px] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              isFavorite(currentTrack.id) ? 'text-[#ED1025]' : 'hover:text-white'
            }`}
            aria-label="Toggle Favorite"
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite(currentTrack.id) ? 'fill-current' : ''}`}
            />
            <span className="hidden xs:inline sm:inline">
              {isFavorite(currentTrack.id) ? 'পছন্দের গান' : 'পছন্দ'}
            </span>
          </button>

          {/* Volume slider (Col 2 - Dead Center) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleMute}
              className="text-white/70 hover:text-white p-1 cursor-pointer"
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
              className="w-14 sm:w-20 h-1 bg-white/20 accent-[#ED1025] rounded-lg cursor-pointer"
              aria-label="Volume slider"
            />
          </div>

          {/* Review / Details Toggle (Col 3) */}
          <button
            onClick={() => setActiveTab(activeTab === 'review' ? 'visuals' : 'review')}
            className={`min-h-[40px] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'review' ? 'text-[#ED1025]' : 'hover:text-white'
            }`}
            aria-label="View Review"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">রিভিউ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
