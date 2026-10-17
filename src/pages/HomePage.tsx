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
} from 'lucide-react';
import { Album, NavigationTab, Track } from '../types/music';
import { MusicService } from '../services/musicService';
import { useAudio } from '../context/AudioContext';
import { AlbumCard } from '../components/AlbumCard';
import { AlbumCarousel } from '../components/AlbumCarousel';
import { SongRow } from '../components/SongRow';
import { CoverImage } from '../components/CoverImage';
import { SlidingBannerCarousel } from '../components/SlidingBannerCarousel';
import { YouTubePromoSection } from '../components/YouTubePromoSection';
import { CommunityFeedbackSection } from '../components/CommunityFeedbackSection';

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

  const slidingBanners = MusicService.getSlidingBanners();
  const branding = MusicService.getBranding();
  const allSongs = MusicService.getAllTracks('newest', false);
  const featuredTracks = MusicService.getFeaturedTracks();
  const latestReleases = MusicService.getLatestReleases(6);
  const albums = MusicService.getAlbums();

  return (
    <div className="space-y-4 sm:space-y-6 pb-2 sm:pb-6">
      {/* 1. Official 4-Slide Banner Carousel - Clean, High Quality 16:9, Pure Images without distracting Play/Like text */}
      <SlidingBannerCarousel
        banners={slidingBanners}
        onSlideClick={(slide, idx) => {
          if (featuredTracks[idx]) {
            playTrack(featuredTracks[idx], allSongs);
          } else if (allSongs[0]) {
            playTrack(allSongs[0], allSongs);
          }
        }}
      />

      {/* 2. Official YouTube Channel Promotion Section */}
      <YouTubePromoSection branding={branding} />

      {/* 2.5 Real-Time Listener Feedback & Comments */}
      <CommunityFeedbackSection />

      {/* 2. Compact Category Shortcuts (Glassmorphism 4-Column Layout) */}
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
              type="button"
              onClick={(e) => {
                e.preventDefault();
                cat.action();
              }}
              className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/40 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-center sm:text-left transition-all hover:border-[#ED1025]/40 hover:shadow-lg group flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3 cursor-pointer active:scale-95 select-none"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/10 group-hover:bg-[#ED1025] flex items-center justify-center text-white transition-colors shrink-0">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0 w-full sm:w-auto">
                <h4 className="text-[11px] sm:text-sm font-bold text-white group-hover:text-[#ED1025] transition-colors truncate">
                  {cat.label}
                </h4>
                <p className="text-[9px] sm:text-[11px] text-neutral-400 truncate mt-0.5">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* 3. If no songs published yet, show Clean Welcome State for listeners */}
      {allSongs.length === 0 ? (
        <section className="p-8 sm:p-12 text-center bg-black/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ED1025]/20 flex items-center justify-center mx-auto text-[#ED1025]">
            <Music2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              হ্যাবাজ্যাবা স্টুডিও লাইভ (Habajaba Studio LIVE)
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto font-bengali leading-relaxed">
              অরিজিনাল বাংলা মিউজিক ও লাইভ স্টুডিও সেশন। নতুন গান খুব শীঘ্রই প্রকাশিত হচ্ছে। সাথেই থাকুন।
            </p>
          </div>
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
                <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shadow-lg group-hover:border-[#ED1025]/40 transition-all">
                  <CoverImage
                    src={track.coverUrl}
                    alt={track.title}
                    title={track.title}
                    artist={track.artist}
                    aspectRatio="video"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#ED1025] text-white flex items-center justify-center shadow-md shadow-[#ED1025]/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title={`Play ${track.title}`}
                    aria-label={`Play ${track.title}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  </button>
                </div>
                <div className="mt-2 px-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#ED1025] transition-colors truncate">
                    {track.title}
                  </h4>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
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
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  All Songs Preview
                </h3>
                <p className="text-xs text-neutral-400 font-medium font-bengali">
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

            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden shadow-xl">
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
