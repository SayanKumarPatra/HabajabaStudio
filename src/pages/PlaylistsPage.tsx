import React, { useState, useMemo } from 'react';
import {
  Plus,
  Play,
  Shuffle,
  ListMusic,
  Trash2,
  ArrowLeft,
  X,
  Disc3,
} from 'lucide-react';
import { Album, Playlist, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { SongRow } from '../components/SongRow';
import { CoverImage } from '../components/CoverImage';

interface PlaylistsPageProps {
  selectedPlaylistId?: string | null;
  onSelectPlaylist: (playlistId: string | null) => void;
  onSelectAlbum: (album: Album) => void;
  onSelectArtist: (artistName: string) => void;
}

export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({
  selectedPlaylistId,
  onSelectPlaylist,
  onSelectAlbum,
  onSelectArtist,
}) => {
  const { playQueue } = useAudio();
  const { userPlaylists, createUserPlaylist, deleteUserPlaylist, removeTrackFromPlaylist } =
    useFavorites();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [version, setVersion] = useState(0);

  React.useEffect(() => {
    const unsub = MusicService.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const curatedPlaylists = MusicService.getCuratedPlaylists();
  const allPlaylists = useMemo(() => {
    return [...curatedPlaylists, ...userPlaylists];
  }, [curatedPlaylists, userPlaylists, version]);

  // If a playlist is selected, find its details and tracks
  const activePlaylist = useMemo(() => {
    if (!selectedPlaylistId) return null;
    return allPlaylists.find((p) => p.id === selectedPlaylistId) || null;
  }, [selectedPlaylistId, allPlaylists]);

  const playlistTracks: Track[] = useMemo(() => {
    if (!activePlaylist) return [];
    return MusicService.getTracksByIds(activePlaylist.trackIds);
  }, [activePlaylist]);

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playQueue(playlistTracks, 0);
    }
  };

  const handleShuffle = () => {
    if (playlistTracks.length > 0) {
      const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = createUserPlaylist(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
    onSelectPlaylist(created.id);
  };

  // If viewing a specific playlist
  if (activePlaylist) {
    return (
      <div className="space-y-6 pb-6">
        {/* Back navigation */}
        <button
          onClick={() => onSelectPlaylist(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Playlists</span>
        </button>

        {/* Playlist Hero - Dark Glassmorphism */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-md border border-white/15 shrink-0 bg-neutral-900">
            <CoverImage
              src={activePlaylist.coverUrl}
              alt={activePlaylist.title}
              title={activePlaylist.title}
              iconType="music"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ED1025]/20 text-[#ED1025] border border-[#ED1025]/30">
                {activePlaylist.isUserCreated ? 'Personal Playlist' : 'Official Curation'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              {activePlaylist.title}
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl font-medium line-clamp-2">
              {activePlaylist.description || 'Curated Bengali acoustic tracks.'}
            </p>

            <div className="text-xs text-neutral-400 font-mono pt-0.5">
              {playlistTracks.length} {playlistTracks.length === 1 ? 'Track' : 'Tracks'}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <button
                onClick={handlePlayAll}
                disabled={playlistTracks.length === 0}
                className="min-h-[40px] px-5 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#ED1025]/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                <span>Play All</span>
              </button>

              <button
                onClick={handleShuffle}
                disabled={playlistTracks.length === 0}
                className="min-h-[40px] px-4 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 border border-white/15 backdrop-blur-md disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>

              {activePlaylist.isUserCreated && (
                <button
                  onClick={() => {
                    deleteUserPlaylist(activePlaylist.id);
                    onSelectPlaylist(null);
                  }}
                  className="min-h-[40px] px-3.5 rounded-full text-red-300 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete this personal playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-white">
            Playlist Tracks
          </h3>

          {playlistTracks.length > 0 ? (
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden shadow-xl">
              {playlistTracks.map((track, idx) => (
                <div key={track.id} className="relative group">
                  <SongRow
                    track={track}
                    index={idx}
                    playlistContext={playlistTracks}
                    onOpenArtist={onSelectArtist}
                    onOpenAlbum={(title) => {
                      const alb = MusicService.getAlbums().find(
                        (a) => a.title.toLowerCase() === title.toLowerCase()
                      );
                      if (alb) onSelectAlbum(alb);
                    }}
                  />
                  {activePlaylist.isUserCreated && (
                    <button
                      onClick={() => removeTrackFromPlaylist(activePlaylist.id, track.id)}
                      className="absolute right-14 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-[#ED1025] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove from this playlist"
                      aria-label="Remove track from playlist"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-black/40 backdrop-blur-xl rounded-2xl border border-dashed border-white/15 space-y-2">
              <p className="text-sm font-semibold text-white">This playlist is empty</p>
              <p className="text-xs text-neutral-400">
                Explore All Songs or Albums and use the menu (···) to add tracks here.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // All Playlists Overview
  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Playlists & Mixes
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium font-bengali">
            অফিশিয়াল এবং নিজস্ব পছন্দসই প্লেলিস্ট
          </p>
        </div>

        {/* Create Playlist Action */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="min-h-[44px] px-4 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#ED1025]/30 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create New Playlist</span>
        </button>
      </div>

      {/* Official Curated Playlists */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-[#ED1025]" />
          <span>Curated Studio Playlists</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {curatedPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group p-4 rounded-2xl bg-black/40 hover:bg-white/10 backdrop-blur-xl border border-white/10 cursor-pointer transition-all hover:border-[#ED1025]/40 hover:shadow-lg flex items-center gap-4 select-none"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-neutral-900">
                <CoverImage
                  src={pl.coverUrl}
                  alt={pl.title}
                  title={pl.title}
                  iconType="music"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white group-hover:text-[#ED1025] transition-colors truncate">
                  {pl.title}
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                  {pl.description}
                </p>
                <span className="text-[11px] font-mono tabular-nums text-neutral-400 mt-1 block">
                  {pl.trackIds.length} Tracks
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Created Playlists */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-[#ED1025]" />
          <span>Personal Playlists (Saved on this Device)</span>
        </h3>

        {userPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl.id)}
                className="group p-4 rounded-2xl bg-black/40 hover:bg-white/10 backdrop-blur-xl border border-white/10 cursor-pointer transition-all hover:border-[#ED1025]/40 hover:shadow-lg flex items-center gap-4 select-none"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-neutral-900 flex items-center justify-center text-[#ED1025]">
                  <ListMusic className="w-7 h-7" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-[#ED1025] transition-colors truncate">
                    {pl.title}
                  </h4>
                  <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                    {pl.description}
                  </p>
                  <span className="text-[11px] font-mono tabular-nums text-neutral-400 mt-1 block">
                    {pl.trackIds.length} Tracks
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-black/40 backdrop-blur-xl rounded-2xl border border-dashed border-white/15 space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-white">
              No custom playlists created yet
            </p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Create a playlist above and build your own custom collection of favorite Bengali studio songs.
            </p>
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#121319]/95 backdrop-blur-2xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/15 space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Create New Playlist</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-200 block mb-1">
                  Playlist Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. My Favorite Acoustic Tracks"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-200 block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Add a short note about this playlist"
                  rows={2}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white shadow-xs cursor-pointer"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
