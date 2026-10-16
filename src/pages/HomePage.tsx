import React, { useState, useEffect } from 'react';
import {
  Play,
  Music2,
  Heart,
  Users,
  ListMusic,
  ChevronRight,
  Disc3,
  Radio,
  Settings,
  Plus,
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
  const { playTrack } = useAudio();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = MusicService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  const banner = MusicService.getHeroBanner();
  const allSongs = MusicService.getAllTracks('newest', false);
  const featuredTracks = MusicService.getFeaturedTracks();
  const heroTrack: Track | undefined =
    (banner.featuredTrackId && MusicService.getTrackById(banner.featuredTrackId)) ||
    featuredTracks[0] ||
    allSongs[0];

  const latestReleases = MusicService.getLatestReleases(6);
  const albums = MusicService.getAlbums();

  const handleHeroPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (heroTrack) {
      playTrack(heroTrack, allSongs);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-6">
      {/* 1. Official 16:9 YouTube Format Banner - Clean & Light (Zero Black Box) */}
      <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#EAEAEA] shadow-xs bg-white group">
        {/* Strictly maintaining 16:9 YouTube aspect ratio, capped for mobile ergonomics */}
        <div className="relative aspect-video w-full max-h-[200px] sm:max-h-[280px] md:max-h-[360px] overflow-hidden bg-neutral-50">
          <img
            src={banner.bannerUrl || '/banner-default.svg'}
            alt="Habajaba Studio LIVE Banner"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/banner-default.svg';
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-101"
          />

          {/* Clean Floating Bottom Glass Strip - Minimalist, No Heavy Black Scrim */}
          <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-md text-white text-[9px] sm:text-xs font-bold mb-0.5">
                <Radio className="w-2.5 h-2.5 text-[#ED1025] animate-pulse" />
                <span>Habajaba Studio LIVE</span>
              </div>
              <h1 className="text-sm sm:text-xl md:text-2xl font-black text-white leading-tight drop-shadow-sm truncate">
                {banner.title || 'Habajaba Studio LIVE'}
              </h1>
              <p className="text-[10px] sm:text-xs text-white/90 font-medium font-bengali truncate hidden xs:block">
                {banner.subtitle || 'অরিজিনাল বাংলা গান · Original Bengali Music'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {heroTrack && (
                <button
                  onClick={handleHeroPlay}
                  className="min-h-[36px] sm:min-h-[42px] px-3.5 sm:px-5 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-[#ED1025]/30 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  <span>Play</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('admin')}
                className="min-h-[36px] sm:min-h-[42px] px-2.5 sm:px-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs flex items-center gap-1 transition-colors border border-white/20"
                title="Change banner in Admin Panel"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">এডমিন</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Compact Category Shortcuts (Ergonomic Mobile Touch Targets) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          {
            id: 'songs',
            label: 'All Songs',
            subtitle: `${allSongs.length} Tracks`,
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
              className="p-3 sm:p-3.5 rounded-2xl bg-white hover:bg-neutral-50 border border-[#EAEAEA] text-left transition-all hover:shadow-xs group flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-[#ED1025]/10 flex items-center justify-center text-[#171717] group-hover:text-[#ED1025] transition-colors shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#171717] group-hover:text-[#ED1025] transition-colors truncate">
                  {cat.label}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[#6B7280] truncate mt-0.5">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* 3. If no songs published yet, show Clean Welcome State with Admin CTA */}
      {allSongs.length === 0 ? (
        <section className="p-8 sm:p-12 text-center bg-neutral-50/70 rounded-3xl border border-dashed border-[#EAEAEA] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-[#EAEAEA] flex items-center justify-center mx-auto text-[#ED1025]">
            <Music2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#171717]">
              হবজব স্টুডিও লাইভে স্বাগতম (Habajaba Studio LIVE)
            </h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto">
              বর্তমানে কোনো গান যুক্ত করা নেই। আপনি অ্যাডমিন প্যানেল থেকে আপনার ড্রপবক্সের অডিও লিঙ্ক দিয়ে খুব সহজেই গান যুক্ত ও ব্যানার পরিবর্তন করতে পারেন।
            </p>
          </div>
          <button
            onClick={() => onNavigate('admin')}
            className="px-6 py-2.5 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>এডমিন প্যানেলে গান যোগ করুন (Open Admin Panel)</span>
          </button>
        </section>
      ) : (
        <>
          {/* 4. Latest Releases in 16:9 YouTube Thumbnail Cards */}
          <AlbumCarousel
            title="Latest Releases"
            subtitle="নতুন রিলিজ ও স্টুডিও সেশন"
            onViewAll={() => onNavigate('songs')}
          >
            {latestReleases.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track, latestReleases)}
                className="group shrink-0 cursor-pointer w-44 sm:w-56 select-none"
              >
                {/* 16:9 YouTube Format Card Thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-100 border border-[#EAEAEA] shadow-xs group-hover:shadow-md transition-all">
                  <CoverImage
                    src={track.coverUrl}
                    alt={track.title}
                    title={track.title}
                    artist={track.artist}
                    aspectRatio="video"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#ED1025] text-white flex items-center justify-center shadow-md shadow-[#ED1025]/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={`Play ${track.title}`}
                    aria-label={`Play ${track.title}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
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

          {/* 5. Popular Albums if present */}
          {albums.length > 0 && (
            <AlbumCarousel
              title="Studio Albums"
              subtitle="অ্যালবাম ও একক সংকলন"
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
          )}

          {/* 6. All Songs Preview */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#171717]">
                  All Songs Preview
                </h3>
                <p className="text-xs text-[#6B7280] font-medium font-bengali">
                  হবজব স্টুডিও লাইভ এর প্রকাশিত গানসমূহ
                </p>
              </div>
              <button
                onClick={() => onNavigate('songs')}
                className="text-xs font-semibold text-[#ED1025] hover:underline flex items-center gap-1 py-1 px-2"
              >
                <span>View All ({allSongs.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAEAEA] divide-y divide-[#EAEAEA] overflow-hidden shadow-xs">
              {allSongs.slice(0, 8).map((track, idx) => (
                <SongRow
                  key={track.id}
                  track={track}
                  index={idx}
                  playlistContext={allSongs}
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
          </section>
        </>
      )}
    </div>
  );
};
