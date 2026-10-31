import { ArrowsUpDownIcon, ChevronDownIcon } from '@heroicons/react/24/solid'

export type EpisodeSortOption = 'episode_number' | 'vote_average' | 'air_date'
export type SortOrder = 'asc' | 'desc'

interface EpisodeFilterBarProps {
  sortBy: EpisodeSortOption
  sortOrder: SortOrder
  onSortChange: (sortBy: EpisodeSortOption, order: SortOrder) => void
  totalEpisodes: number
}

function EpisodeFilterBar({ sortBy, sortOrder, onSortChange, totalEpisodes }: EpisodeFilterBarProps) {
  const sortOptions: { value: EpisodeSortOption; label: string }[] = [
    { value: 'episode_number', label: 'Bölüm Numarası' },
    { value: 'vote_average', label: 'Puan' },
    { value: 'air_date', label: 'Yayın Tarihi' },
  ]

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as EpisodeSortOption, sortOrder)
  }

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="sticky top-0 z-10 border-b border-line bg-surface-void/95 py-4 backdrop-blur-sm motion-reduce:backdrop-blur-none">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Bölüm sayısı */}
          <div className="text-sm text-secondary">
            <span className="font-semibold tabular-nums text-primary">{totalEpisodes}</span> Bölüm
          </div>

          {/* Sıralama */}
          <div className="flex items-center gap-2">
            <ArrowsUpDownIcon className="h-4 w-4 text-muted" aria-hidden="true" />
            <span className="hidden text-sm font-medium text-secondary sm:inline">Sırala:</span>

            <div className="relative">
              <select
                value={sortBy}
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
              title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
              aria-label={sortOrder === 'asc' ? 'Artan sırala' : 'Azalan sırala'}
            >
              <span className="tabular-nums" aria-hidden="true">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EpisodeFilterBar
