import React from 'react';
import { Home, Music2, Users, Search, ListMusic } from 'lucide-react';
import { NavigationTab } from '../types/music';

interface BottomNavigationProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onNavigate,
}) => {
  const items: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'songs', label: 'Songs', icon: Music2 },
    { id: 'artists', label: 'Artists', icon: Users },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl border-t border-neutral-200/50 shadow-[0_-8px_32px_rgba(0,0,0,0.07)] pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 items-center h-16 px-1 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'artists' && currentTab === 'artist-details') ||
            (item.id === 'playlists' && currentTab === 'playlist-details') ||
            (item.id === 'songs' && currentTab === 'album-details');

          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.id);
              }}
              className={`group min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 relative select-none cursor-pointer active:scale-90 active:-translate-y-0.5 ${
                isActive
                  ? 'text-[#ED1025]'
                  : 'text-[#6B7280] hover:text-[#171717]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Glass Pill Backdrop for Active State */}
              {isActive && (
                <span className="absolute inset-x-1.5 inset-y-1 rounded-xl bg-red-500/10 border border-red-500/20 shadow-xs pointer-events-none transition-all duration-300 animate-in fade-in zoom-in-95" />
              )}

              {/* Icon with Dynamic Scaling */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive
                      ? 'scale-110 stroke-[2.4] text-[#ED1025]'
                      : 'stroke-[1.8] group-hover:scale-105'
                  }`}
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#ED1025] ring-2 ring-white shadow-xs" />
                )}
              </div>

              {/* Pure English Clean Label */}
              <span
                className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'font-bold text-[#ED1025] scale-105'
                    : 'font-medium text-[#6B7280] group-hover:text-[#171717]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
