import React from 'react';
import {
  Play,
  Music2,
  Heart,
  Users,
  ListMusic,
  ChevronRight,
  Disc3,
  Radio,
} from 'lucide-react';
import { Album, NavigationTab, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { useAudio } from '../context/AudioContext';
import { AlbumCard } from '../components/AlbumCard';
import { AlbumCarousel } from '../components/AlbumCarousel';
import { SongRow } from '../components/SongRow';
import { CoverImage } from '../components/CoverImage';

interface HomePageProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectAlbum: (album: Album) => void;
  onSelectArtist: (artistName: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectAlbum,
  onSelectArtist,
}) => {
  const { playTrack, playQueue } = useAudio();

  const featuredTracks = MusicService.getFeaturedTracks();
  const heroTrack: Track | undefined = featuredTracks[0] || MusicService.getAllTracks()[0];
  const latestReleases = MusicService.getLatestReleases(6);
  const albums = MusicService.getAlbums();
  const allSongs = MusicService.getAllTracks().slice(0, 6);

  const handleHeroPlay = () => {
    if (heroTrack) {
      playTrack(heroTrack, featuredTracks.length > 0 ? featuredTracks : [heroTrack]);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-6">
      {/* 1. Brand Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white shadow-xl border border-neutral-800">
        {/* Visual studio background with acoustic aesthetic */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-[#2A0E12] opacity-95" />
          {/* Subtle acoustic soundwave graphic overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ED1025_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Hero Text & CTA */}
          <div className="max-w-xl text-center md:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-md">
              <Radio className="w-3.5 h-3.5 text-[#ED1025] animate-pulse" />
              <span>Studio Acoustic Sessions</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Habajaba Studio <span className="text-[#ED1025]">LIVE</span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 font-medium font-bengali">
              অরিজিনাল বাংলা গান · Original Bengali Music
            </p>

            <p className="text-xs sm:text-sm text-neutral-400 max-w-md pt-1">
              Immerse yourself in live acoustic sessions, folk fusion, and contemporary Bengali music produced with authentic acoustic instruments and raw vocal warmth.
            </p>

            {/* Play Now CTA when featured track is configured */}
            {heroTrack && (
              <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={handleHeroPlay}
                  className="min-h-[48px] px-6 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white font-semibold text-sm flex items-center gap-2.5 shadow-lg shadow-[#ED1025]/30 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  <span>Play Featured Session</span>
                </button>
                <div className="text-left hidden sm:block">
                  <span className="text-[11px] text-neutral-400 block">Now Featured</span>
                  <span className="text-xs font-semibold text-white truncate max-w-[200px] block">
                    {heroTrack.title}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Hero Image Card */}
          <div className="relative shrink-0 w-56 sm:w-64 md:w-72 aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/15 group">
            {heroTrack ? (
              <CoverImage
                src={heroTrack.coverUrl}
                alt={heroTrack.title}
                title={heroTrack.title}
                artist={heroTrack.artist}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <Disc3 className="w-16 h-16 text-[#ED1025]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs font-semibold text-white/90 truncate">
                {heroTrack?.title || 'Habajaba Studio Acoustics'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Shortcuts */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            id: 'songs',
            label: 'All Songs',
            subtitle: 'Full catalog',
            icon: Music2,
            action: () => onNavigate('songs'),
          },
          {
            id: 'favorites',
            label: 'Favorites',
            subtitle: 'Saved tracks',
            icon: Heart,
            action: () => onNavigate('favorites'),
          },
          {
            id: 'artists',
            label: 'Artists',
            subtitle: 'Studio vocalists',
            icon: Users,
            action: () => onNavigate('artists'),
          },
          {
            id: 'playlists',
            label: 'Playlists',
            subtitle: 'Curated mixes',
            icon: ListMusic,
            action: () => onNavigate('playlists'),
          },
        ].map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={cat.action}
              className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-neutral-50 border border-[#EAEAEA] text-left transition-all hover:shadow-xs group flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 group-hover:bg-[#ED1025]/10 flex items-center justify-center text-[#171717] group-hover:text-[#ED1025] transition-colors shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#171717] group-hover:text-[#ED1025] transition-colors truncate">
                  {cat.label}
                </h4>
                <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* 3. Latest Releases Carousel */}
      <AlbumCarousel
        title="Latest Releases"
        subtitle="Fresh studio sessions and singles"
        onViewAll={() => onNavigate('songs')}
      >
        {latestReleases.map((track) => (
          <div
            key={track.id}
            onClick={() => playTrack(track, latestReleases)}
            className="group shrink-0 cursor-pointer w-36 sm:w-44 select-none"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-[#EAEAEA] shadow-xs group-hover:shadow-md transition-all">
              <CoverImage
                src={track.coverUrl}
                alt={track.title}
                title={track.title}
                artist={track.artist}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <button
                className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-[#ED1025] text-white flex items-center justify-center shadow-md shadow-[#ED1025]/30 opacity-0 group-hover:opacity-100 transition-opacity"
                title={`Play ${track.title}`}
                aria-label={`Play ${track.title}`}
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              </button>
            </div>
            <div className="mt-2 px-0.5">
              <h4 className="text-xs sm:text-sm font-semibold text-[#171717] group-hover:text-[#ED1025] transition-colors truncate">
                {track.title}
              </h4>
              <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                {track.artist}
              </p>
            </div>
          </div>
        ))}
      </AlbumCarousel>

      {/* 4. Popular Albums Carousel */}
      <AlbumCarousel
        title="Popular Albums"
        subtitle="Curated collections and studio EP albums"
        onViewAll={() => onNavigate('playlists')}
      >
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onSelect={onSelectAlbum}
            size="md"
          />
        ))}
      </AlbumCarousel>

      {/* 5. All Songs Preview */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#171717]">
              All Songs Preview
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5 font-medium">
              Top recorded Bengali tracks from Habajaba Studio
            </p>
          </div>
          <button
            onClick={() => onNavigate('songs')}
            className="text-xs font-semibold text-[#ED1025] hover:underline flex items-center gap-1 py-1 px-2"
          >
            <span>View All ({MusicService.getAllTracks().length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAEAEA] divide-y divide-[#EAEAEA] overflow-hidden shadow-xs">
          {allSongs.map((track, idx) => (
            <SongRow
              key={track.id}
              track={track}
              index={idx}
              playlistContext={allSongs}
              onOpenArtist={onSelectArtist}
              onOpenAlbum={(title) => {
                const alb = albums.find((a) => a.title.toLowerCase() === title.toLowerCase());
                if (alb) onSelectAlbum(alb);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
