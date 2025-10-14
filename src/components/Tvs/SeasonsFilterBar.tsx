import { useState } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon, 
  ArrowsUpDownIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

export type SortOption = 'season_number' | 'vote_average' | 'air_date' | 'episode_count';
export type SortOrder = 'asc' | 'desc';
export type StatusFilter = 'all' | 'completed' | 'ongoing';

export interface SeasonFilters {
  minRating: number;
  status: StatusFilter;
}

export interface SeasonSortConfig {
  sortBy: SortOption;
  sortOrder: SortOrder;
}

interface SeasonsFilterBarProps {
  sortConfig: SeasonSortConfig;
  filters: SeasonFilters;
  onSortChange: (sortBy: SortOption, order: SortOrder) => void;
  onFilterChange: (filters: SeasonFilters) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

function SeasonsFilterBar({
  sortConfig,
  filters,
  onSortChange,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: SeasonsFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'season_number', label: 'Sezon Numarası' },
    { value: 'vote_average', label: 'Puan' },
    { value: 'air_date', label: 'Yayın Tarihi' },
    { value: 'episode_count', label: 'Bölüm Sayısı' },
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Tümü' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'ongoing', label: 'Devam Ediyor' },
  ];

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortOption, sortConfig.sortOrder);
  };

  const toggleSortOrder = () => {
    onSortChange(sortConfig.sortBy, sortConfig.sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      minRating: parseFloat(e.target.value),
    });
  };

  const handleStatusChange = (status: StatusFilter) => {
    onFilterChange({
      ...filters,
      status,
    });
  };

  return (
    <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center gap-2 flex-1">
            <ArrowsUpDownIcon className="h-5 w-5 text-slate-400" />
            <span className="text-slate-400 text-sm font-medium">Sırala:</span>
            
            <div className="relative">
              <select
                value={sortConfig.sortBy}
                onChange={handleSortChange}
                className="appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg 
                           px-4 py-2 pr-10 text-white text-sm font-medium
                           hover:border-cyan-500/50 focus:border-cyan-500 focus:outline-none 
                           transition-colors cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={toggleSortOrder}
              className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg 
                         hover:border-cyan-500/50 transition-colors"
              title={sortConfig.sortOrder === 'asc' ? 'Artan' : 'Azalan'}
            >
              <span className="text-white text-sm font-semibold">
                {sortConfig.sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 
                       rounded-lg hover:border-cyan-500/50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5 text-slate-400" />
            <span className="text-white text-sm font-medium">Filtrele</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-cyan-500 rounded-full text-white text-xs font-bold">
                !
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 
                         rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-red-400" />
              <span className="text-red-400 text-sm font-medium">Temizle</span>
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-4 animate-fadeIn">
            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-slate-300">
                <span>Minimum Puan: {filters.minRating.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filters.minRating}
                onChange={handleRatingChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-cyan-500
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-moz-range-thumb]:w-4
                           [&::-moz-range-thumb]:h-4
                           [&::-moz-range-thumb]:rounded-full
                           [&::-moz-range-thumb]:bg-cyan-500
                           [&::-moz-range-thumb]:border-0
                           [&::-moz-range-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0.0</span>
                <span>10.0</span>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Durum:</label>
              <div className="flex gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.status === option.value
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeasonsFilterBar;
