import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Youtube,
  Check,
  Search,
} from 'lucide-react';
import { Artist } from '../types/music';
import { MusicService } from '../services/musicService';
import { ArtistEditModal } from './ArtistEditModal';

export const ArtistsAdminSection: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>(() => MusicService.getArtists());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    return MusicService.subscribe(() => {
      setArtists(MusicService.getArtists());
    });
  }, []);

  const filteredArtists = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.role && a.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedArtist(null);
    setIsModalOpen(true);
  };

  const handleDelete = (artist: Artist) => {
    if (window.confirm(`Are you sure you want to remove artist "${artist.name}"?`)) {
      MusicService.deleteArtist(artist.id);
      setStatusMessage(`Artist "${artist.name}" removed successfully.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header and Controls */}
      <div className="p-5 sm:p-6 bg-black/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-[#ED1025] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Artist Profile &amp; Bio Management
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Upload artist profile pictures directly to Firebase Cloud Storage, and update biography and social links in the Realtime Database &amp; Firestore.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Filter */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter artists..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-white/15 focus:border-[#ED1025] focus:outline-hidden bg-black/60 text-white placeholder-neutral-500"
            />
          </div>

          <button
            type="button"
            onClick={handleAddNew}
            className="min-h-[38px] px-4 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#ED1025]/30 transition-colors cursor-pointer select-none active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Artist</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Artists Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArtists.map((artist) => {
          const artistTracks = MusicService.getTracksByArtist(artist.name);

          return (
            <div
              key={artist.id}
              className="p-4 sm:p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4 shadow-xl group"
            >
              <div className="flex items-start gap-3.5">
                {/* Avatar Preview */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-neutral-900 border-2 border-white/15 shrink-0 shadow-md">
                  {artist.avatarUrl ? (
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/banner-default.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 font-black text-lg">
                      {artist.name.charAt(0) || 'A'}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-[#ED1025] transition-colors">
                    {artist.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-[#ED1025] truncate">
                    {artist.role || 'Bengali Vocalist'}
                  </p>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                    {artist.bio || 'Official artist profile.'}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                    <span>{artistTracks.length} Tracks in Studio</span>
                    {artist.youtubeUrl && (
                      <span className="text-red-400 font-semibold flex items-center gap-0.5">
                        · <Youtube className="w-2.5 h-2.5 inline" /> YouTube
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleEdit(artist)}
                  className="min-h-[34px] px-3.5 rounded-lg bg-white/10 hover:bg-[#ED1025] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(artist)}
                  className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Remove Artist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredArtists.length === 0 && (
        <div className="p-8 text-center bg-black/40 backdrop-blur-xl rounded-2xl border border-dashed border-white/15 text-neutral-400 text-xs">
          No artists matching your search query.
        </div>
      )}

      {/* Edit / Add Modal */}
      <ArtistEditModal
        isOpen={isModalOpen}
        artist={selectedArtist}
        onClose={() => setIsModalOpen(false)}
        onSaved={(updated) => {
          setIsModalOpen(false);
          setStatusMessage(`Profile for "${updated.name}" saved successfully to Firebase & Realtime Database!`);
          setTimeout(() => setStatusMessage(null), 4000);
        }}
      />
    </div>
  );
};
