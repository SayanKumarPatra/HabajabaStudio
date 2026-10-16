import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Music2, Disc3, Users } from 'lucide-react';
import { Album } from '../types/music';
import { MusicService } from '../services/musicService';
import { SongRow } from '../components/SongRow';
import { AlbumCard } from '../components/AlbumCard';
import { ArtistCard } from '../components/ArtistCard';

interface SearchPageProps {
  onSelectAlbum: (album: Album) => void;
  onSelectArtist: (artistName: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  onSelectAlbum,
  onSelectArtist,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'songs' | 'albums' | 'artists'>('all');
  const [version, setVersion] = useState(0);

  React.useEffect(() => {
    const unsub = MusicService.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const results = useMemo(() => {
    return MusicService.search(query);
  }, [query, version]);

  const totalResults =
    results.tracks.length + results.albums.length + results.artists.length;

  return (
    <div className="space-y-6 pb-6">
      {/* Search Header */}
      <div className="space-y-3 pb-2 border-b border-[#EAEAEA]">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171717]">
          Search Catalog
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] font-medium font-bengali">
          গান, শিল্পী, অ্যালবাম বা জঁর খুঁজুন · Search songs, artists, albums, or genres
        </p>

        {/* Big Search Input with Clear Button */}
        <div className="relative max-w-2xl pt-1">
          <SearchIcon className="w-5 h-5 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type in Bengali or English (e.g., মেঘের ডাকে, Rabindra, Arghya)..."
            autoFocus
            className="w-full text-sm pl-11 pr-10 py-3 rounded-2xl border border-[#EAEAEA] focus:border-[#ED1025] focus:ring-2 focus:ring-[#ED1025]/10 focus:outline-hidden bg-white shadow-xs"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#6B7280] transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        {query.trim() && (
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: `All (${totalResults})` },
              { id: 'songs', label: `Songs (${results.tracks.length})` },
              { id: 'albums', label: `Albums (${results.albums.length})` },
              { id: 'artists', label: `Artists (${results.artists.length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === f.id
                    ? 'bg-[#ED1025] text-white shadow-xs'
                    : 'bg-neutral-100 text-[#6B7280] hover:text-[#171717]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      {!query.trim() ? (
        /* Empty State / Recommended Searches */
        <div className="p-8 sm:p-12 text-center bg-neutral-50/70 rounded-3xl border border-[#EAEAEA] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-[#EAEAEA] flex items-center justify-center mx-auto text-[#ED1025]">
            <SearchIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#171717]">
              Explore Habajaba Studio LIVE
            </h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-1">
              Search by Bengali title, English romanization, artist name, or album.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {['মেঘের ডাকে', 'Rabindra Sangeet', 'Arghya', 'Monsoon', 'Debarati'].map(
              (suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#EAEAEA] hover:border-[#ED1025] text-xs text-[#171717] transition-colors"
                >
                  {suggestion}
                </button>
              )
            )}
          </div>
        </div>
      ) : totalResults === 0 ? (
        /* No Matches State */
        <div className="p-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-[#EAEAEA] space-y-2">
          <p className="text-sm font-semibold text-[#171717]">No matches found for "{query}"</p>
          <p className="text-xs text-[#6B7280]">
            Check your spelling or try searching for another artist or song name.
          </p>
        </div>
      ) : (
        /* Results Groups */
        <div className="space-y-8">
          {/* Songs Results */}
          {(filterType === 'all' || filterType === 'songs') && results.tracks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Music2 className="w-4 h-4 text-[#ED1025]" />
                <h3 className="text-sm sm:text-base font-bold text-[#171717]">
                  Songs ({results.tracks.length})
                </h3>
              </div>
              <div className="bg-white rounded-2xl border border-[#EAEAEA] divide-y divide-[#EAEAEA] overflow-hidden shadow-xs">
                {results.tracks.map((track, idx) => (
                  <SongRow
                    key={track.id}
                    track={track}
                    index={idx}
                    playlistContext={results.tracks}
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
            </div>
          )}

          {/* Albums Results */}
          {(filterType === 'all' || filterType === 'albums') && results.albums.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Disc3 className="w-4 h-4 text-[#ED1025]" />
                <h3 className="text-sm sm:text-base font-bold text-[#171717]">
                  Albums ({results.albums.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.albums.map((album) => (
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

          {/* Artists Results */}
          {(filterType === 'all' || filterType === 'artists') && results.artists.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Users className="w-4 h-4 text-[#ED1025]" />
                <h3 className="text-sm sm:text-base font-bold text-[#171717]">
                  Artists ({results.artists.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {results.artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onSelect={(a) => onSelectArtist(a.name)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
