import type { Season } from '../types/tvsDetails';
import type { SeasonFilters, SeasonSortConfig, SortOption, SortOrder, StatusFilter } from '../components/Tvs/SeasonsFilterBar';

/**
 * Filter seasons by minimum rating
 */
export const filterByRating = (seasons: Season[], minRating: number): Season[] => {
  if (minRating === 0) return seasons;
  
  return seasons.filter(season => {
    const rating = season.vote_average || 0;
    return rating >= minRating;
  });
};

/**
 * Filter seasons by status (completed/ongoing)
 */
export const filterByStatus = (seasons: Season[], status: StatusFilter): Season[] => {
  if (status === 'all') return seasons;
  
  const now = new Date();
  
  return seasons.filter(season => {
    if (!season.air_date) return status === 'ongoing';
    
    const airDate = new Date(season.air_date);
    const isCompleted = airDate < now;
    
    return status === 'completed' ? isCompleted : !isCompleted;
  });
};

/**
 * Apply all filters to seasons
 */
export const applyFilters = (seasons: Season[], filters: SeasonFilters): Season[] => {
  let filtered = [...seasons];
  
  // Apply rating filter
  filtered = filterByRating(filtered, filters.minRating);
  
  // Apply status filter
  filtered = filterByStatus(filtered, filters.status);
  
  return filtered;
};

/**
 * Sort seasons by season number
 */
const sortBySeasonNumber = (seasons: Season[], order: SortOrder): Season[] => {
  return [...seasons].sort((a, b) => {
    const diff = a.season_number - b.season_number;
    return order === 'asc' ? diff : -diff;
  });
};

/**
 * Sort seasons by rating
 */
const sortByRating = (seasons: Season[], order: SortOrder): Season[] => {
  return [...seasons].sort((a, b) => {
    const ratingA = a.vote_average || 0;
    const ratingB = b.vote_average || 0;
    const diff = ratingA - ratingB;
    return order === 'asc' ? diff : -diff;
  });
};

/**
 * Sort seasons by air date
 */
const sortByAirDate = (seasons: Season[], order: SortOrder): Season[] => {
  return [...seasons].sort((a, b) => {
    if (!a.air_date && !b.air_date) return 0;
    if (!a.air_date) return order === 'asc' ? 1 : -1;
    if (!b.air_date) return order === 'asc' ? -1 : 1;
    
    const dateA = new Date(a.air_date).getTime();
    const dateB = new Date(b.air_date).getTime();
    const diff = dateA - dateB;
    return order === 'asc' ? diff : -diff;
  });
};

/**
 * Sort seasons by episode count
 */
const sortByEpisodeCount = (seasons: Season[], order: SortOrder): Season[] => {
  return [...seasons].sort((a, b) => {
    const diff = (a.episode_count || 0) - (b.episode_count || 0);
    return order === 'asc' ? diff : -diff;
  });
};

/**
 * Apply sorting to seasons
 */
export const applySorting = (seasons: Season[], sortConfig: SeasonSortConfig): Season[] => {
  const { sortBy, sortOrder } = sortConfig;
  
  switch (sortBy) {
    case 'season_number':
      return sortBySeasonNumber(seasons, sortOrder);
    case 'vote_average':
      return sortByRating(seasons, sortOrder);
    case 'air_date':
      return sortByAirDate(seasons, sortOrder);
    case 'episode_count':
      return sortByEpisodeCount(seasons, sortOrder);
    default:
      return seasons;
  }
};

/**
 * Apply both filters and sorting to seasons
 */
export const filterAndSortSeasons = (
  seasons: Season[],
  filters: SeasonFilters,
  sortConfig: SeasonSortConfig
): Season[] => {
  const filtered = applyFilters(seasons, filters);
  const sorted = applySorting(filtered, sortConfig);
  return sorted;
};
