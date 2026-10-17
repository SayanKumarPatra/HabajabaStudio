import React from 'react';
import { Track } from '../types/music';
import { CoverImage } from './CoverImage';

interface VinylDiscPlayerProps {
  track: Track;
  isPlaying: boolean;
  className?: string;
}

export const VinylDiscPlayer: React.FC<VinylDiscPlayerProps> = ({
  track,
  isPlaying,
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center mx-auto select-none ${className}`}
      aria-label="Vinyl Record Player"
    >
      {/* Outer Glow when playing */}
      <div
        className={`absolute -inset-3 rounded-full bg-gradient-to-tr from-[#ED1025]/40 via-amber-500/20 to-[#ED1025]/30 blur-2xl transition-all duration-700 pointer-events-none ${
          isPlaying ? 'opacity-90 scale-105 animate-pulse' : 'opacity-20 scale-95'
        }`}
      />

      {/* The Single Rotating Round Vinyl Disc (পুরোটাই সম্পূর্ণ গোল) */}
      <div
        className="relative w-56 h-56 sm:w-68 sm:h-68 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-[#121214] via-[#1E1E22] to-[#0A0A0C] border-4 border-neutral-800 shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex items-center justify-center p-3 overflow-hidden cursor-pointer"
        style={{
          animation: 'spin 8s linear infinite',
          animationPlayState: isPlaying ? 'running' : 'paused',
        }}
      >
        {/* Realistic Vinyl Concentric Grooves (মাইক্রো-গ্রুভস) */}
        <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute inset-4 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute inset-7 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute inset-10 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute inset-13 rounded-full border border-white/5 pointer-events-none" />

        {/* Vinyl Sheen Light Reflection Angle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

        {/* Center Circular Label with the Uploaded Song Banner / Cover Image */}
        <div className="relative z-10 w-32 h-32 sm:w-38 sm:h-38 md:w-42 md:h-42 rounded-full overflow-hidden border-2 border-white/60 shadow-xl bg-neutral-900 flex items-center justify-center">
          <CoverImage
            src={track.coverUrl}
            alt={track.title}
            title={track.title}
            artist={track.artist}
            className="w-full h-full object-cover rounded-full"
            aspectRatio="square"
          />

          {/* Center Spindle Hole (সেন্টার পিন ও মেটালিক রিং) */}
          <div className="absolute inset-0 m-auto w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#171717] border-2 border-white/80 shadow-md flex items-center justify-center pointer-events-none z-20">
            <div className="w-2 h-2 rounded-full bg-neutral-400" />
          </div>

          {/* Studio Wordmark on circular label rim */}
          <div className="absolute bottom-1 inset-x-0 text-center pointer-events-none z-20">
            <span className="text-[7px] sm:text-[8px] font-mono font-black text-white/90 uppercase tracking-widest bg-black/60 px-1.5 py-0.2 rounded-full backdrop-blur-xs">
              HABAJABA LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
