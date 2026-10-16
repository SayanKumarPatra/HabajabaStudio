import React from 'react';
import { Search, Heart } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { NavigationTab } from '../types/music';
import { useFavorites } from '../context/FavoritesContext';

interface AppHeaderProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  onNavigate,
}) => {
  const { favorites } = useFavorites();

  const navItems: { id: NavigationTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'songs', label: 'All Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'search', label: 'Search' },
    { id: 'playlists', label: 'Playlists' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#ED1025]/95 backdrop-blur-xl border-b border-[#D00D20] text-white shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-2.5 md:gap-8">
        {/* Zone 1: Official Brand Wordmark / Logo */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('home')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('home')}
          className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white rounded-xl shrink-0 active:scale-98 transition-transform select-none"
          aria-label="Habajaba Studio LIVE Home"
        >
          <BrandLogo size="md" showSubtitle={true} variant="white" />
        </div>

        {/* Zone 2: Desktop Navigation Links (Pure English, High Contrast White on Red) */}
        <nav
          className="hidden md:flex items-center gap-1.5 text-sm font-medium"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`whitespace-nowrap transition-all px-3.5 py-1.5 rounded-full text-xs font-semibold select-none cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#ED1025] shadow-xs font-bold'
                    : 'text-white/85 hover:text-white hover:bg-white/15'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Favorites, Search) - Admin is kept hidden from public view */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Favorites count indicator */}
          <button
            type="button"
            onClick={() => onNavigate('favorites')}
            title="Saved Favorites"
            aria-label="View Favorite Songs"
            className={`min-h-[36px] min-w-[36px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center rounded-full transition-all cursor-pointer relative ${
              currentTab === 'favorites'
                ? 'bg-white text-[#ED1025] shadow-xs'
                : 'text-white/90 hover:text-white hover:bg-white/15'
            }`}
          >
            <Heart
              className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                favorites.length > 0 ? 'fill-current' : 'stroke-[2]'
              }`}
            />
            {favorites.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white ring-2 ring-[#ED1025]"></span>
              </span>
            )}
          </button>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => onNavigate('search')}
            title="Search tracks, artists, albums"
            aria-label="Search"
            className={`min-h-[36px] min-w-[36px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center rounded-full transition-all cursor-pointer ${
              currentTab === 'search'
                ? 'bg-white text-[#ED1025] shadow-xs'
                : 'text-white/90 hover:text-white hover:bg-white/15'
            }`}
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
