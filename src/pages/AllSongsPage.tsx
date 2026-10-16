import React, { useState, useMemo, useEffect } from 'react';
import { Play, Shuffle, Filter, ArrowUpDown } from 'lucide-react';
import { Album, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { useAudio } from '../context/AudioContext';
import { SongRow } from '../components/SongRow';

interface AllSongsPageProps {
  onSelectAlbum: (album: Album) => void;
  onSelectArtist: (artistName: string) => void;
}

export const AllSongsPage: React.FC<AllSongsPageProps> = ({
  onSelectAlbum,
  onSelectArtist,
}) => {
  const { playQueue } = useAudio();
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'artist'>('newest');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = MusicService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const genres = ['All', ...MusicService.getGenres()];
  const allTracks = MusicService.getAllTracks(sortBy, false);
  const albums = MusicService.getAlbums();

  const filteredTracks = useMemo(() => {
    if (selectedGenre === 'All') return allTracks;
    return allTracks.filter((t) => t.genre === selectedGenre);
  }, [allTracks, selectedGenre]);

  const handlePlayAll = () => {
    if (filteredTracks.length > 0) {
      playQueue(filteredTracks, 0);
    }
  };

  const handleShuffle = () => {
    if (filteredTracks.length > 0) {
      const shuffled = [...filteredTracks].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EAEAEA]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171717]">
            All Songs
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5 font-medium font-bengali">
            {filteredTracks.length} প্রকাশিত গান · Original Bengali Audio Tracks
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {filteredTracks.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                className="min-h-[42px] px-5 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all"
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                <span>Play All</span>
              </button>

              <button
                onClick={handleShuffle}
                className="min-h-[42px] px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#171717] font-semibold text-xs sm:text-sm flex items-center gap-1.5 border border-[#EAEAEA] transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                <span className="hidden xs:inline">Shuffle</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Sort Bar */}
      {genres.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Genre Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <Filter className="w-3.5 h-3.5 text-[#6B7280] mr-1 shrink-0" />
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedGenre === genre
                    ? 'bg-[#171717] text-white'
                    : 'bg-neutral-100 text-[#6B7280] hover:text-[#171717] hover:bg-neutral-200/70'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#6B7280]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white border border-[#EAEAEA] rounded-lg px-2.5 py-1.5 text-[#171717] focus:outline-hidden focus:border-[#ED1025]"
              aria-label="Sort tracks"
            >
              <option value="newest">Newest Releases</option>
              <option value="title">Title (A-Z)</option>
              <option value="artist">Artist Name</option>
            </select>
          </div>
        </div>
      )}

      {/* Song List */}
      {filteredTracks.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAEAEA] divide-y divide-[#EAEAEA] overflow-hidden shadow-xs">
          {filteredTracks.map((track, idx) => (
            <SongRow
              key={track.id}
              track={track}
              index={idx}
              playlistContext={filteredTracks}
              onOpenArtist={onSelectArtist}
              onOpenAlbum={(title) => {
                const alb = albums.find(
                  (a) => a.title.toLowerCase() === title.toLowerCase()
                );
                if (alb) onSelectAlbum(alb);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="p-10 text-center bg-neutral-50 rounded-2xl border border-dashed border-[#EAEAEA] space-y-2">
          <p className="text-sm font-semibold text-[#171717]">
            শীঘ্রই নতুন গান প্রকাশিত হচ্ছে (New Tracks Coming Soon)
          </p>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto font-bengali">
            হ্যাবাজ্যাবা স্টুডিও লাইভের নতুন অরিজিনাল মাস্টার্স প্রস্তুতি চলছে। সাথেই থাকুন।
          </p>
        </div>
      )}
    </div>
  );
};
