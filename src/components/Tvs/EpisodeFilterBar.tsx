import { ArrowsUpDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export type EpisodeSortOption = 'episode_number' | 'vote_average' | 'air_date';
export type SortOrder = 'asc' | 'desc';

interface EpisodeFilterBarProps {
  sortBy: EpisodeSortOption;
  sortOrder: SortOrder;
  onSortChange: (sortBy: EpisodeSortOption, order: SortOrder) => void;
  totalEpisodes: number;
}

function EpisodeFilterBar({ 
  sortBy, 
  sortOrder, 
  onSortChange, 
  totalEpisodes 
}: EpisodeFilterBarProps) {
  const sortOptions: { value: EpisodeSortOption; label: string }[] = [
    { value: 'episode_number', label: 'Bölüm Numarası' },
    { value: 'vote_average', label: 'Puan' },
    { value: 'air_date', label: 'Yayın Tarihi' },
  ];

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as EpisodeSortOption, sortOrder);
  };

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Episode Count */}
          <div className="text-slate-300">
            <span className="font-semibold text-white">{totalEpisodes}</span> Bölüm
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <ArrowsUpDownIcon className="h-5 w-5 text-slate-400" />
            <span className="text-slate-400 text-sm font-medium hidden sm:inline">Sırala:</span>
            
            <div className="relative">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg 
                           px-4 py-2 pr-10 text-white text-sm font-medium
                           hover:border-blue-500/50 focus:border-blue-500 focus:outline-none 
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
                         hover:border-blue-500/50 transition-colors"
              title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
            >
              <span className="text-white text-sm font-semibold">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EpisodeFilterBar;
