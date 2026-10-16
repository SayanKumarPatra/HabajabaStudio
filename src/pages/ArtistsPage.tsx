import React, { useState, useMemo } from 'react';
import { Search, Mic2, Play, ArrowLeft, Youtube, ExternalLink } from 'lucide-react';
import { Album, Artist, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { useAudio } from '../context/AudioContext';
import { ArtistCard } from '../components/ArtistCard';
import { SongRow } from '../components/SongRow';
import { AlbumCard } from '../components/AlbumCard';
import { CoverImage } from '../components/CoverImage';

interface ArtistsPageProps {
  selectedArtistName?: string | null;
  onSelectArtist: (artistName: string | null) => void;
  onSelectAlbum: (album: Album) => void;
}

export const ArtistsPage: React.FC<ArtistsPageProps> = ({
  selectedArtistName,
  onSelectArtist,
  onSelectAlbum,
}) => {
  const { playQueue } = useAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [version, setVersion] = useState(0);

  React.useEffect(() => {
    const unsub = MusicService.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const artists = MusicService.getArtists();

  // If an artist is currently selected, render the Artist Details view
  const activeArtist = useMemo(() => {
    if (!selectedArtistName) return null;
    return (
      artists.find(
        (a) => a.name.toLowerCase() === selectedArtistName.toLowerCase()
      ) || {
        id: 'custom',
        name: selectedArtistName,
        avatarUrl: '',
        role: 'Bengali Vocalist',
        bio: 'Featured artist recording with Habajaba Studio LIVE.',
      }
    );
  }, [selectedArtistName, artists]);

  const artistTracks = useMemo(() => {
    if (!activeArtist) return [];
    return MusicService.getTracksByArtist(activeArtist.name);
  }, [activeArtist]);

  const artistAlbums = useMemo(() => {
    if (!activeArtist) return [];
    return MusicService.getAlbumsByArtist(activeArtist.name);
  }, [activeArtist]);

  // Search filtered artists for main page
  const filteredArtists = useMemo(() => {
    if (!searchQuery.trim()) return artists;
    const q = searchQuery.toLowerCase();
    return artists.filter(
      (a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    );
  }, [artists, searchQuery]);

  // Handlers for artist details view
  const handlePlayArtistTracks = () => {
    if (artistTracks.length > 0) {
      playQueue(artistTracks, 0);
    }
  };

  if (activeArtist) {
    return (
      <div className="space-y-6 pb-6">
        {/* Back Button */}
        <button
          onClick={() => onSelectArtist(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#171717] transition-colors py-1 px-2 rounded-lg hover:bg-neutral-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Artists</span>
        </button>

        {/* Artist Hero Header - Clean White & Red (No Black Box) */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAEAEA] shadow-xs">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-neutral-100 border-2 border-[#ED1025]/20 shrink-0 shadow-xs flex items-center justify-center">
            {activeArtist.avatarUrl ? (
              <CoverImage
                src={activeArtist.avatarUrl}
                alt={activeArtist.name}
                title={activeArtist.name}
                artist={activeArtist.name}
                aspectRatio="square"
                iconType="music"
                className="w-full h-full rounded-full"
              />
            ) : (
              <Mic2 className="w-8 h-8 text-[#ED1025]" />
            )}
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-[#ED1025]">
              Featured Vocalist
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[#171717]">
              {activeArtist.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-xl font-medium line-clamp-2">
              {activeArtist.bio}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#6B7280] pt-0.5 font-mono">
              <span>{artistTracks.length} Published Tracks</span>
              {artistAlbums.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{artistAlbums.length} Albums</span>
                </>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              {artistTracks.length > 0 && (
                <button
                  onClick={handlePlayArtistTracks}
                  className="min-h-[40px] px-5 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm shadow-[#ED1025]/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  <span>Play All Tracks</span>
                </button>
              )}

              {activeArtist.youtubeUrl && (
                <a
                  href={activeArtist.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[40px] px-4 rounded-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Youtube className="w-4 h-4 fill-current" />
                  <span>YouTube Channel</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Artist Songs */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-[#171717]">
            Songs by {activeArtist.name}
          </h3>
          {artistTracks.length > 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAEAEA] divide-y divide-[#EAEAEA] overflow-hidden shadow-xs">
              {artistTracks.map((track, idx) => (
                <SongRow
                  key={track.id}
                  track={track}
                  index={idx}
                  playlistContext={artistTracks}
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
              No tracks published for this artist yet.
            </div>
          )}
        </div>

        {/* Artist Albums if any */}
        {artistAlbums.length > 0 && (
          <div className="space-y-3 pt-3">
            <h3 className="text-base sm:text-lg font-bold text-[#171717]">
              Albums by {activeArtist.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {artistAlbums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onSelect={onSelectAlbum}
                  size="md"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Artists Directory View
  return (
    <div className="space-y-6 pb-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAEAEA]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171717]">
            Artists & Vocalists
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium font-bengali">
            হবজব স্টুডিও লাইভ এর শিল্পী ও কলাকুশলীবৃন্দ
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artists..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden bg-white"
          />
        </div>
      </div>

      {/* Grid of Artists */}
      {filteredArtists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredArtists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onSelect={(a) => onSelectArtist(a.name)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-[#EAEAEA]">
          <p className="text-sm font-semibold text-[#171717]">No artists found</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Try searching with a different name.
          </p>
        </div>
      )}
    </div>
  );
};
