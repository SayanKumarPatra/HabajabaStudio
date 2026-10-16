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
    { id: 'songs', label: 'All Songs', icon: Music2 },
    { id: 'artists', label: 'Artists', icon: Users },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 items-center h-16 px-1">
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
              onClick={() => onNavigate(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-all relative ${
                isActive
                  ? 'text-[#ED1025]'
                  : 'text-[#6B7280] hover:text-[#171717]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span
                className={`text-[10px] tracking-tight mt-1 whitespace-nowrap ${
                  isActive ? 'font-semibold text-[#ED1025]' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-[#ED1025]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
