import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  Plus,
  Share2,
  Disc3,
  Check,
} from 'lucide-react';
import { Track } from '../types/music';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { CoverImage } from './CoverImage';

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
  onOpenAlbum,
  onOpenArtist,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudio();
  const { favorites, toggleFavorite, userPlaylists, addTrackToPlaylist } = useFavorites();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#song-${track.id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Right: Duration, Favorite Heart, More Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Duration */}
        <span className="text-[11px] sm:text-xs font-mono tabular-nums text-neutral-400 mr-1 hidden sm:inline">
          {track.duration || '--:--'}
        </span>

        {/* Favorite heart button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track.id);
          }}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${
            isFav
              ? 'text-[#ED1025]'
              : 'text-neutral-400 hover:text-white opacity-60 sm:opacity-0 group-hover:opacity-100'
          }`}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* More options menu button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-neutral-400 hover:text-white transition-colors"
            title="More options"
            aria-label="Track options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Options */}
          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-10 z-50 w-48 bg-[#121319]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/15 py-1 text-xs text-white animate-in fade-in duration-150"
            >
              {onOpenAlbum && track.album && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenAlbum(track.album);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 text-neutral-200 hover:text-white"
                >
                  <Disc3 className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">Go to Album: {track.album}</span>
                </button>
              )}


              {userPlaylists.length > 0 && (
                <div className="border-t border-white/10 my-1 pt-1">
                  <span className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Add to Playlist
                  </span>
                  {userPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        addTrackToPlaylist(pl.id, track.id);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 truncate text-neutral-200 hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#ED1025]" />
                      <span className="truncate">{pl.title}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleCopyLink}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 border-t border-white/10 text-neutral-200 hover:text-white cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy Share Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
