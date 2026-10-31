/**
 * ImageGalleryToolbar Component
 * Provides filtering, sorting, and view mode controls
 */

import { memo } from 'react';
import { Squares2X2Icon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import type { SortOption, FilterLanguage, ViewMode } from '../../types/media';

interface ImageGalleryToolbarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterLanguage: FilterLanguage;
  onFilterChange: (filter: FilterLanguage) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount: number;
}

const selectClasses =
  'rounded-lg border border-line-strong bg-surface-overlay px-3 py-1.5 text-sm text-primary transition-colors duration-150 ease-cine hover:border-accent';

const ImageGalleryToolbar = memo<ImageGalleryToolbarProps>(({
  sortBy,
  onSortChange,
  filterLanguage,
  onFilterChange,
  viewMode,
  onViewModeChange,
  totalCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-line bg-surface-raised p-4">
      {/* Left side - Filters and Sort */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-secondary">
            Sırala:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={selectClasses}
          >
            <option value="vote_average">En Yüksek Oy</option>
            <option value="vote_count">En Çok Oylanan</option>
            <option value="width">En Geniş</option>
            <option value="height">En Uzun</option>
          </select>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="text-sm font-medium text-secondary">
            Dil:
          </label>
          <select
            id="language-select"
            value={filterLanguage}
            onChange={(e) => onFilterChange(e.target.value as FilterLanguage)}
            className={selectClasses}
          >
            <option value="all">Tümü</option>
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="null">Dil Yok</option>
          </select>
        </div>

        {/* Count */}
        <div className="text-sm text-secondary">
          <span className="font-semibold text-primary">{totalCount}</span> görsel
        </div>
      </div>

      {/* Right side - View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-secondary">Görünüm:</span>
        <div className="flex items-center gap-1 rounded-lg bg-surface-overlay p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`rounded p-2 transition-colors duration-150 ease-cine ${
              viewMode === 'grid'
                ? 'bg-accent text-accent-ink'
                : 'text-secondary hover:bg-surface-raised hover:text-primary'
            }`}
            aria-label="Izgara Görünüm"
            aria-pressed={viewMode === 'grid'}
            title="Izgara Görünüm"
          >
            <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('masonry')}
            className={`rounded p-2 transition-colors duration-150 ease-cine ${
              viewMode === 'masonry'
                ? 'bg-accent text-accent-ink'
                : 'text-secondary hover:bg-surface-raised hover:text-primary'
            }`}
            aria-label="Mozaik Görünüm"
            aria-pressed={viewMode === 'masonry'}
            title="Mozaik Görünüm"
          >
            <ViewColumnsIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
});

ImageGalleryToolbar.displayName = 'ImageGalleryToolbar';

export default ImageGalleryToolbar;
