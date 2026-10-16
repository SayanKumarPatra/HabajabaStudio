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
    <div className="space-y-4 sm:space-y-6 pb-2 sm:pb-6">
      {/* 1. Official 16:9 YouTube Format Banner - Clean, High Quality, Zero Black Box */}
      <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#EAEAEA] shadow-xs bg-white group">
        {/* Flatter widescreen ratio for mobile ergonomics, prevents pushing songs down */}
        <div className="relative aspect-[21/9] xs:aspect-[2.35/1] sm:aspect-[2.5/1] md:aspect-[16/9] w-full max-h-[135px] xs:max-h-[150px] sm:max-h-[220px] md:max-h-[340px] overflow-hidden bg-neutral-50 flex items-center justify-center">
          <img
            src={banner.bannerUrl || '/banner-default.svg'}
            alt="Habajaba Studio LIVE Official Banner"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/banner-default.svg';
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
          />

          {/* Top-Left Live Studio Pill (Clean White, Zero Dark Gradient) */}
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-md text-[#ED1025] text-[9.5px] sm:text-xs font-bold border border-white/80 shadow-xs">
            <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#ED1025] animate-pulse" />
            <span className="font-semibold tracking-wide">Habajaba LIVE</span>
          </div>

          {/* Bottom-Right Play Action (Clean Floating Button, Zero Dark Gradient) */}
          {heroTrack && (
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10">
              <button
                onClick={handleHeroPlay}
                className="h-7 px-2.5 sm:h-10 sm:px-4 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-[#ED1025]/30 active:scale-95 transition-all"
                title={`Play ${heroTrack.title}`}
              >
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current translate-x-0.5" />
                <span>Play</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. Compact Category Shortcuts (Mobile 4-Column Layout, Zero Vertical Spill) */}
      <section className="grid grid-cols-4 gap-2 sm:gap-3">
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
            subtitle: 'Vocalists',
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
              className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white hover:bg-neutral-50 border border-[#EAEAEA] text-center sm:text-left transition-all hover:shadow-xs group flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3 cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-100 group-hover:bg-[#ED1025]/10 flex items-center justify-center text-[#171717] group-hover:text-[#ED1025] transition-colors shrink-0">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0 w-full sm:w-auto">
                <h4 className="text-[11px] sm:text-sm font-bold text-[#171717] group-hover:text-[#ED1025] transition-colors truncate">
                  {cat.label}
                </h4>
                <p className="text-[9px] sm:text-[11px] text-[#6B7280] truncate hidden xs:block sm:block mt-0.5">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* 3. If no songs published yet, show Clean Welcome State with Admin CTA */}
      {allSongs.length === 0 ? (
        <section className="p-6 sm:p-10 text-center bg-neutral-50/70 rounded-2xl sm:rounded-3xl border border-dashed border-[#EAEAEA] space-y-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-xs border border-[#EAEAEA] flex items-center justify-center mx-auto text-[#ED1025]">
            <Music2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-[#171717]">
              হবজব স্টুডিও লাইভে স্বাগতম (Habajaba Studio LIVE)
            </h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto font-bengali leading-relaxed">
              বর্তমানে কোনো গান যুক্ত করা নেই। আপনি অ্যাডমিন প্যানেল থেকে আপনার ড্রপবক্সের অডিও লিঙ্ক দিয়ে খুব সহজেই গান যুক্ত ও ব্যানার পরিবর্তন করতে পারেন।
            </p>
          </div>
          <button
            onClick={() => onNavigate('admin')}
            className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
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
