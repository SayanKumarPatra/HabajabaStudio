import React from 'react';
import { Heart, Play, Shuffle, Music2, Info } from 'lucide-react';
import { Album, NavigationTab, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { SongRow } from '../components/SongRow';

interface FavoritesPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectAlbum: (album: Album) => void;
  onSelectArtist: (artistName: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  onNavigate,
  onSelectAlbum,
  onSelectArtist,
}) => {
  const { playQueue } = useAudio();
  const { favorites, clearFavorites } = useFavorites();

  const favoriteTracks: Track[] = MusicService.getTracksByIds(favorites);
  const albums = MusicService.getAlbums();

  const handlePlayAll = () => {
    if (favoriteTracks.length > 0) {
      playQueue(favoriteTracks, 0);
    }
  };

  const handleShuffle = () => {
    if (favoriteTracks.length > 0) {
      const shuffled = [...favoriteTracks].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAEAEA]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ED1025]/10 flex items-center justify-center text-[#ED1025]">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171717]">
              Favorites
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium font-bengali">
            {favoriteTracks.length} প্রিয় বাংলা গান · Your Saved Tracks
          </p>
        </div>

        {/* Global actions */}
        {favoriteTracks.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayAll}
              className="min-h-[44px] px-5 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all"
            >
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
              <span>Play All</span>
            </button>

            <button
              onClick={handleShuffle}
              className="min-h-[44px] px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#171717] font-semibold text-xs sm:text-sm flex items-center gap-1.5 border border-[#EAEAEA] transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden xs:inline">Shuffle</span>
            </button>

            <button
              onClick={clearFavorites}
              className="text-xs text-[#6B7280] hover:text-[#ED1025] px-2 py-1"
              title="Clear all favorites"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Persistence notice as explicitly required */}
      <div className="p-3.5 rounded-xl bg-neutral-50 border border-[#EAEAEA] flex items-start gap-2.5 text-xs text-[#6B7280]">
        <Info className="w-4 h-4 text-[#ED1025] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#171717]">Device Storage: </span>
          <span>
            Your favorited songs are saved locally in your current web browser and do not sync across different devices or incognito windows. No login or account is required.
          </span>
        </div>
      </div>

      {/* Tracks List */}
      {favoriteTracks.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAEAEA] divide-y divide-[#EAEAEA] overflow-hidden shadow-xs">
          {favoriteTracks.map((track, idx) => (
            <SongRow
              key={track.id}
              track={track}
              index={idx}
              playlistContext={favoriteTracks}
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
        /* Empty State */
        <div className="p-12 text-center bg-neutral-50/70 rounded-3xl border border-dashed border-[#EAEAEA] space-y-4">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-[#6B7280]">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#171717]">
              No favorite songs yet
            </h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1">
              Tap the heart icon on any song in the catalog or player to add it to your personal favorites collection.
            </p>
          </div>
          <button
            onClick={() => onNavigate('songs')}
            className="px-6 py-2.5 rounded-full bg-[#171717] hover:bg-neutral-800 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Music2 className="w-4 h-4 text-[#ED1025]" />
            <span>Browse All Songs</span>
          </button>
        </div>
      )}
    </div>
  );
};
