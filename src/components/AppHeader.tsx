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
    <header className="sticky top-0 z-30 w-full bg-[#ED1025] text-white shadow-md border-b border-[#D00D20] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Brand Wordmark / Official Logo (Clean on Radiant Red, Zero White Box) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('home')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('home')}
          className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white rounded-lg shrink-0"
          aria-label="Habajaba Studio LIVE Home"
        >
          <BrandLogo size="md" showSubtitle={true} variant="white" />
        </div>

        {/* Zone 2: Desktop 5-Nav Links (High Contrast White on Red) */}
        <nav
          className="hidden md:flex items-center gap-1.5 text-sm font-medium"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`whitespace-nowrap transition-all px-3 py-1 rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-white text-[#ED1025] shadow-xs'
                    : 'text-white/85 hover:text-white hover:bg-white/15'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Favorites, Search) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Favorites count indicator */}
          <button
            onClick={() => onNavigate('favorites')}
            title="Saved Favorites"
            aria-label="View Favorite Songs"
            className={`min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] flex items-center justify-center rounded-full transition-colors relative ${
              currentTab === 'favorites'
                ? 'bg-white text-[#ED1025] shadow-xs'
                : 'text-white/90 hover:text-white hover:bg-white/15'
            }`}
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            {favorites.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white ring-2 ring-[#ED1025]"></span>
              </span>
            )}
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => onNavigate('search')}
            title="Search Bengali tracks, artists, albums"
            aria-label="Search"
            className={`min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] flex items-center justify-center rounded-full transition-colors ${
              currentTab === 'search'
                ? 'bg-white text-[#ED1025] shadow-xs'
                : 'text-white/90 hover:text-white hover:bg-white/15'
            }`}
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
