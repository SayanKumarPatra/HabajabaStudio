import React from 'react';
import { Play, Shuffle, ArrowLeft, Disc3, Calendar, Globe, Tag } from 'lucide-react';
import { Album, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { useAudio } from '../context/AudioContext';
import { SongRow } from '../components/SongRow';
import { CoverImage } from '../components/CoverImage';

interface AlbumDetailsPageProps {
  album: Album;
  onBack: () => void;
  onSelectArtist: (artistName: string) => void;
  onSelectAlbum: (album: Album) => void;
}

export const AlbumDetailsPage: React.FC<AlbumDetailsPageProps> = ({
  album,
  onBack,
  onSelectArtist,
  onSelectAlbum,
}) => {
  const { playQueue } = useAudio();
  const albumTracks: Track[] = MusicService.getAlbumTracks(album);

  const handlePlayAll = () => {
    if (albumTracks.length > 0) {
      playQueue(albumTracks, 0);
    }
  };

  const handleShuffle = () => {
    if (albumTracks.length > 0) {
      const shuffled = [...albumTracks].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#171717] transition-colors py-1 px-2 rounded-lg hover:bg-neutral-100"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Releases</span>
      </button>

      {/* Album Header Hero */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 sm:p-8 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
          <CoverImage
            src={album.coverUrl}
            alt={album.title}
            title={album.title}
            artist={album.artist}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="text-center sm:text-left space-y-2 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ED1025] text-white">
              Studio Album
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            {album.title}
          </h1>

          <p
            onClick={() => onSelectArtist(album.artist)}
            className="text-sm sm:text-base text-neutral-300 font-semibold cursor-pointer hover:text-white hover:underline transition-colors"
          >
            {album.artist}
          </p>

          {album.description && (
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl font-medium pt-1">
              {album.description}
            </p>
          )}

          {/* Metadata badges (clean unboxed) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-neutral-400 pt-2 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#ED1025]" />
              <span>{album.releaseDate}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#ED1025]" />
              <span>{album.genre}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#ED1025]" />
              <span>{album.language}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{albumTracks.length} Tracks</span>
          </div>

          {/* Action controls */}
          <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              onClick={handlePlayAll}
              disabled={albumTracks.length === 0}
              className="min-h-[44px] px-6 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#ED1025]/30 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
              <span>Play Album</span>
            </button>

            <button
              onClick={handleShuffle}
              disabled={albumTracks.length === 0}
              className="min-h-[44px] px-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 border border-white/10 disabled:opacity-50 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Album Tracklist */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-[#171717] flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-[#ED1025]" />
          <span>Tracklist</span>
        </h3>

        {albumTracks.length > 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAEAEA] divide-y divide-[#EAEAEA] overflow-hidden shadow-xs">
            {albumTracks.map((track, idx) => (
              <SongRow
                key={track.id}
                track={track}
                index={idx}
                playlistContext={albumTracks}
                onOpenArtist={onSelectArtist}
                onOpenAlbum={(title) => {
                  const alb = MusicService.getAlbums().find(
                    (a) => a.title.toLowerCase() === title.toLowerCase()
                  );
                  if (alb) onSelectAlbum(alb);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-[#EAEAEA] text-xs text-[#6B7280]">
            No tracks in this album yet.
          </div>
        )}
      </div>
    </div>
  );
};
