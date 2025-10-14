/**
 * MediaGalleryTabs Component
 * Tab navigation for media gallery categories
 */

import { memo } from 'react';
import type { MediaTab } from '../../types/media';

interface TabConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}

interface MediaGalleryTabsProps {
  tabs: MediaTab[];
  activeTab: MediaTab;
  onTabChange: (tab: MediaTab) => void;
  tabConfig: Record<MediaTab, TabConfig>;
  gender?: number;
}

const MediaGalleryTabs = memo<MediaGalleryTabsProps>(({
  tabs,
  activeTab,
  onTabChange,
  tabConfig,
  gender,
}) => {
  // Gender-based color theme
  const isMale = gender === 2;
  const isFemale = gender === 1;
  const hasGender = isMale || isFemale;
  
  const activeGradient = hasGender
    ? isMale
      ? 'from-blue-500 to-cyan-500'
      : 'from-purple-500 to-pink-500'
    : 'from-cyan-500 to-blue-500'; // Default
  
  const activeShadow = hasGender
    ? isMale
      ? 'shadow-blue-500/30'
      : 'shadow-purple-500/30'
    : 'shadow-cyan-500/30'; // Default
  
  const focusRing = hasGender
    ? isMale
      ? 'focus:ring-blue-500'
      : 'focus:ring-purple-500'
    : 'focus:ring-cyan-500'; // Default

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const config = tabConfig[tab];
        const Icon = config.icon;
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300
              ${isActive
                ? `bg-gradient-to-r ${activeGradient} text-white shadow-lg ${activeShadow}`
                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/50'
              }
              focus:outline-none focus:ring-2 ${focusRing} focus:ring-offset-2 focus:ring-offset-slate-900
            `}
            aria-label={`View ${config.label}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" />
            <span>{config.label}</span>
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-semibold
              ${isActive
                ? 'bg-white/20 text-white'
                : 'bg-slate-700/50 text-slate-400'
              }
            `}>
              {config.count}
            </span>
          </button>
        );
      })}
    </div>
  );
});

MediaGalleryTabs.displayName = 'MediaGalleryTabs';

export default MediaGalleryTabs;
