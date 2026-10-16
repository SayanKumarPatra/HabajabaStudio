import React from 'react';
import { Search, HelpCircle, Heart } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { NavigationTab } from '../types/music';
import { useFavorites } from '../context/FavoritesContext';

interface AppHeaderProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenDropboxGuide: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenDropboxGuide,
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
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#EAEAEA] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark / Official Logo */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('home')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('home')}
          className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ED1025] rounded-lg shrink-0"
          aria-label="Habajaba Studio LIVE Home"
        >
          <BrandLogo size="md" showSubtitle={true} />
        </div>

        {/* Zone 2: Desktop 5-Nav Links (Strictly single line, unboxed, clean typography) */}
        <nav
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6B7280]"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`whitespace-nowrap transition-colors py-1 relative ${
                  isActive
                    ? 'text-[#ED1025] font-semibold'
                    : 'hover:text-[#171717]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ED1025] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Favorites shortcut, Search trigger, Dropbox Setup helper) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Favorites count indicator */}
          <button
            onClick={() => onNavigate('favorites')}
            title="Saved Favorites"
            aria-label="View Favorite Songs"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors relative ${
              currentTab === 'favorites'
                ? 'text-[#ED1025] bg-[#ED1025]/10'
                : 'text-[#6B7280] hover:text-[#171717] hover:bg-neutral-100'
            }`}
          >
            <Heart className="w-5 h-5 fill-current" />
            {favorites.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ED1025]"></span>
              </span>
            )}
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => onNavigate('search')}
            title="Search Bengali tracks, artists, albums"
            aria-label="Search"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${
              currentTab === 'search'
                ? 'text-[#ED1025] bg-[#ED1025]/10'
                : 'text-[#6B7280] hover:text-[#171717] hover:bg-neutral-100'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Dropbox Audio Guide & Direct Link Tester */}
          <button
            onClick={onOpenDropboxGuide}
            title="Dropbox Audio Configuration & Link Tester"
            aria-label="Dropbox Guide"
            className="min-h-[44px] px-3 hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#171717] bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors border border-[#EAEAEA]"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#ED1025]" />
            <span className="whitespace-nowrap">Dropbox Audio Help</span>
          </button>
        </div>
      </div>
    </header>
  );
};
