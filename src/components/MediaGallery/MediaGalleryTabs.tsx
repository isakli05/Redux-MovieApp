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
  /** Kept for API compatibility (person pages pass it); palette is gender-neutral gold now. */
  gender?: number;
}

const MediaGalleryTabs = memo<MediaGalleryTabsProps>(({
  tabs,
  activeTab,
  onTabChange,
  tabConfig,
}) => {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Medya kategorileri">
      {tabs.map((tab) => {
        const config = tabConfig[tab];
        const Icon = config.icon;
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            onClick={() => onTabChange(tab)}
            className={`
              flex items-center gap-2 rounded-lg border px-4 py-2.5 font-medium transition-colors duration-150 ease-cine
              ${isActive
                ? 'border-accent bg-surface-overlay text-accent'
                : 'border-line bg-surface-raised text-secondary hover:border-line-strong hover:text-primary'
              }
            `}
            aria-label={`${config.label} sekmesi`}
            aria-selected={isActive}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{config.label}</span>
            <span className={`
              rounded-full px-2 py-0.5 text-xs font-semibold
              ${isActive
                ? 'bg-accent text-accent-ink'
                : 'bg-surface-overlay text-muted'
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
