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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-800/30 backdrop-blur-lg border border-slate-700/50 rounded-xl">
      {/* Left side - Filters and Sort */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-slate-400 font-medium">
            Sırala:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="vote_average">En Yüksek Oy</option>
            <option value="vote_count">En Çok Oylanan</option>
            <option value="width">En Geniş</option>
            <option value="height">En Uzun</option>
          </select>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="text-sm text-slate-400 font-medium">
            Dil:
          </label>
          <select
            id="language-select"
            value={filterLanguage}
            onChange={(e) => onFilterChange(e.target.value as FilterLanguage)}
            className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">Tümü</option>
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="null">Dil Yok</option>
          </select>
        </div>

        {/* Count */}
        <div className="text-sm text-slate-400">
          <span className="font-semibold text-white">{totalCount}</span> görsel
        </div>
      </div>

      {/* Right side - View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 font-medium">Görünüm:</span>
        <div className="flex items-center gap-1 p-1 bg-slate-700/50 rounded-lg">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-cyan-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
            }`}
            aria-label="Grid View"
            title="Grid View"
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('masonry')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'masonry'
                ? 'bg-cyan-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
            }`}
            aria-label="Masonry View"
            title="Masonry View"
          >
            <ViewColumnsIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

ImageGalleryToolbar.displayName = 'ImageGalleryToolbar';

export default ImageGalleryToolbar;
