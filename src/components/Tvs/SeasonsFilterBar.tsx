import { useState } from 'react'
import { FunnelIcon, XMarkIcon, ArrowsUpDownIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { Button, Chip } from '../ui'

export type SortOption = 'season_number' | 'vote_average' | 'air_date' | 'episode_count'
export type SortOrder = 'asc' | 'desc'
export type StatusFilter = 'all' | 'completed' | 'ongoing'

export interface SeasonFilters {
  minRating: number
  status: StatusFilter
}

export interface SeasonSortConfig {
  sortBy: SortOption
  sortOrder: SortOrder
}

interface SeasonsFilterBarProps {
  sortConfig: SeasonSortConfig
  filters: SeasonFilters
  onSortChange: (sortBy: SortOption, order: SortOrder) => void
  onFilterChange: (filters: SeasonFilters) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

function SeasonsFilterBar({
  sortConfig,
  filters,
  onSortChange,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: SeasonsFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'season_number', label: 'Sezon Numarası' },
    { value: 'vote_average', label: 'Puan' },
    { value: 'air_date', label: 'Yayın Tarihi' },
    { value: 'episode_count', label: 'Bölüm Sayısı' },
  ]

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Tümü' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'ongoing', label: 'Devam Ediyor' },
  ]

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortOption, sortConfig.sortOrder)
  }

  const toggleSortOrder = () => {
    onSortChange(sortConfig.sortBy, sortConfig.sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      minRating: parseFloat(e.target.value),
    })
  }

  const handleStatusChange = (status: StatusFilter) => {
    onFilterChange({
      ...filters,
      status,
    })
  }

  return (
    <div className="sticky top-0 z-10 border-b border-line bg-surface-void/95 py-4 backdrop-blur-sm motion-reduce:backdrop-blur-none">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {/* Sıralama */}
          <div className="flex flex-1 items-center gap-2">
            <ArrowsUpDownIcon className="h-4 w-4 text-muted" aria-hidden="true" />
            <span className="hidden text-sm font-medium text-secondary sm:inline">Sırala:</span>

            <div className="relative">
              <select
                value={sortConfig.sortBy}
                onChange={handleSortChange}
                aria-label="Sıralama ölçütü"
                className="cursor-pointer appearance-none rounded-md border border-line bg-surface-raised py-2 pl-4 pr-10 text-sm font-medium text-primary transition-colors duration-150 ease-cine hover:border-line-strong focus:border-accent focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>

            <button
              type="button"
              onClick={toggleSortOrder}
              className="rounded-md border border-line bg-surface-raised p-2 text-sm font-semibold text-primary transition-colors duration-150 ease-cine hover:border-line-strong focus:border-accent focus:outline-none"
              title={sortConfig.sortOrder === 'asc' ? 'Artan' : 'Azalan'}
              aria-label={sortConfig.sortOrder === 'asc' ? 'Artan sırala' : 'Azalan sırala'}
            >
              <span className="tabular-nums" aria-hidden="true">
                {sortConfig.sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          </div>

          {/* Filtre düğmesi */}
          <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)} aria-expanded={isFilterOpen}>
            <FunnelIcon className="h-4 w-4" aria-hidden="true" />
            Filtrele
            {hasActiveFilters && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-accent-ink tabular-nums">
                !
              </span>
            )}
          </Button>

          {/* Filtreleri temizle */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              Temizle
            </Button>
          )}
        </div>

        {/* Filtre Paneli */}
        {isFilterOpen && (
          <div className="mt-4 space-y-5 rounded-lg border border-line bg-surface-base p-4 animate-fadeIn motion-reduce:animate-none">
            {/* Puan */}
            <div className="space-y-2">
              <label
                htmlFor="season-min-rating"
                className="flex items-center justify-between text-sm font-medium text-secondary"
              >
                <span>Minimum Puan</span>
                <span className="tabular-nums text-accent">{filters.minRating.toFixed(1)}</span>
              </label>
              <input
                id="season-min-rating"
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filters.minRating}
                onChange={handleRatingChange}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-overlay
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                           [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                           [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs tabular-nums text-muted">
                <span>0.0</span>
                <span>10.0</span>
              </div>
            </div>

            {/* Durum */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-secondary">Durum:</span>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Chip
                    key={option.value}
                    active={filters.status === option.value}
                    onClick={() => handleStatusChange(option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SeasonsFilterBar
