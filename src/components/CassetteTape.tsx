import React from 'react';
import { Track } from '../types/music';

interface CassetteTapeProps {
  track: Track;
  isPlaying: boolean;
  className?: string;
}

export const CassetteTape: React.FC<CassetteTapeProps> = ({
  track,
  isPlaying,
  className = '',
}) => {
  return (
    <div
      className={`relative w-72 sm:w-84 md:w-92 h-44 sm:h-52 md:h-56 mx-auto select-none ${className}`}
      aria-label="Vintage Cassette Tape Player"
    >
      {/* Outer Glow when playing */}
      <div
        className={`absolute -inset-2 rounded-2xl bg-gradient-to-r from-red-600/30 via-amber-500/20 to-purple-600/30 blur-xl transition-all duration-700 pointer-events-none ${
          isPlaying ? 'opacity-80 scale-102' : 'opacity-20 scale-98'
        }`}
      />

      {/* 1. Cassette Shell Body (Acrylic Smoky Dark Chassis) */}
      <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-[#2A2A2E] via-[#1C1C20] to-[#141416] border-2 border-white/20 shadow-2xl p-2.5 flex flex-col justify-between overflow-hidden">
        {/* Corner Screws (4 corners) */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center shadow-inner">
          <div className="w-1.5 h-0.5 bg-neutral-700" />
        </div>
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center shadow-inner">
          <div className="w-1.5 h-0.5 bg-neutral-700" />
        </div>
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center shadow-inner">
          <div className="w-1.5 h-0.5 bg-neutral-700" />
        </div>
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center shadow-inner">
          <div className="w-1.5 h-0.5 bg-neutral-700" />
        </div>

        {/* 2. Paper Label Sticker Area */}
        <div className="relative w-full h-28 sm:h-34 rounded-xl bg-gradient-to-b from-[#EDEDED] via-[#F4F4F6] to-[#E2E2E6] border border-neutral-300 shadow-sm p-2 flex flex-col justify-between text-neutral-900 overflow-hidden">
          {/* Top Label Header Strip */}
          <div className="flex items-center justify-between border-b-2 border-[#ED1025] pb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ED1025]" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase font-mono text-[#ED1025]">
                HABAJABA LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono font-bold text-neutral-700">
              <span className="px-1.5 py-0.2 rounded bg-neutral-200 border border-neutral-300">
                SIDE A
              </span>
              <span>C-90 · STEREO</span>
            </div>
          </div>

          {/* Song & Artist Title on Label */}
          <div className="flex items-center justify-between gap-2 px-1 py-0.5">
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black truncate text-neutral-900 tracking-tight">
                {track.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-bold text-[#ED1025] truncate">
                {track.artist}
              </p>
            </div>
            {track.genre && (
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-200/80 text-neutral-600 shrink-0">
                {track.genre}
              </span>
            )}
          </div>

          {/* 3. Center Transparent Cassette Window with Double Spools */}
          <div className="relative w-44 sm:w-56 h-12 sm:h-16 mx-auto rounded-lg bg-neutral-950/90 border border-neutral-700 shadow-inner flex items-center justify-between px-3 sm:px-5 overflow-hidden">
            {/* Magnetic Tape Ribbon connecting both spools */}
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-5 bg-[#3B2820] opacity-80 pointer-events-none border-t border-b border-[#2A1C16]" />

            {/* Central Window Ruler Scale (0 - 50 - 100) */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 pointer-events-none opacity-40 font-mono text-[8px] text-white">
              <span>0</span>
              <span className="w-1 h-0.5 bg-white" />
              <span>50</span>
              <span className="w-1 h-0.5 bg-white" />
              <span>100</span>
            </div>

            {/* SPOOL 1 (Left Wheel) - Spins when isPlaying */}
            <div className="relative z-10 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#201511] border-2 border-white/40 shadow-md flex items-center justify-center">
              {/* Tape Roll Pack (Left reel) */}
              <div className="absolute inset-0.5 rounded-full border border-neutral-700" />
              {/* Spinning Gear with 6 Teeth */}
              <div
                className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white border border-neutral-400 flex items-center justify-center"
                style={{
                  animation: 'spin 3s linear infinite',
                  animationPlayState: isPlaying ? 'running' : 'paused',
                }}
              >
                {/* 6 Cog spokes */}
                <div className="absolute w-full h-0.5 bg-neutral-700" />
                <div className="absolute w-full h-0.5 bg-neutral-700 rotate-60" />
                <div className="absolute w-full h-0.5 bg-neutral-700 -rotate-60" />
                {/* Center hole */}
                <div className="relative z-10 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-neutral-900 border border-neutral-500" />
              </div>
            </div>

            {/* SPOOL 2 (Right Wheel) - Spins when isPlaying */}
            <div className="relative z-10 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#201511] border-2 border-white/40 shadow-md flex items-center justify-center">
              {/* Tape Roll Pack (Right reel) */}
              <div className="absolute inset-0.5 rounded-full border border-neutral-700" />
              {/* Spinning Gear with 6 Teeth */}
              <div
                className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white border border-neutral-400 flex items-center justify-center"
                style={{
                  animation: 'spin 3s linear infinite',
                  animationPlayState: isPlaying ? 'running' : 'paused',
                }}
              >
                {/* 6 Cog spokes */}
                <div className="absolute w-full h-0.5 bg-neutral-700" />
                <div className="absolute w-full h-0.5 bg-neutral-700 rotate-60" />
                <div className="absolute w-full h-0.5 bg-neutral-700 -rotate-60" />
                {/* Center hole */}
                <div className="relative z-10 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-neutral-900 border border-neutral-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Cassette Head & Guide Rollers Area */}
        <div className="relative w-full h-8 sm:h-10 mt-1 flex items-center justify-between px-6 bg-gradient-to-b from-[#1E1E22] to-[#141416] rounded-b-xl border-t border-neutral-700/60">
          {/* Left Guide Roller */}
          <div className="w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-600 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
          </div>

          {/* Magnetic Head Inset Notch */}
          <div className="w-20 sm:w-28 h-5 rounded-t-md bg-neutral-900 border-x border-t border-neutral-700 flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-xs bg-[#ED1025]" />
            <span className="text-[8px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
              {isPlaying ? 'PLAYING' : 'PAUSED'}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-neutral-600'}`} />
          </div>

          {/* Right Guide Roller */}
          <div className="w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-600 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
