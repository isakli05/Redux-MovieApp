import type { Episode } from '../types/tvSeasons';
import type { EpisodeSortOption, SortOrder } from '../components/Tvs/EpisodeFilterBar';

export const sortEpisodes = (
  episodes: Episode[],
  sortBy: EpisodeSortOption,
  sortOrder: SortOrder
): Episode[] => {
  const sorted = [...episodes].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'episode_number':
        comparison = a.episode_number - b.episode_number;
        break;
      
      case 'vote_average':
        comparison = (a.vote_average || 0) - (b.vote_average || 0);
        break;
      
      case 'air_date':
        if (!a.air_date && !b.air_date) return 0;
        if (!a.air_date) return 1;
        if (!b.air_date) return -1;
        comparison = new Date(a.air_date).getTime() - new Date(b.air_date).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};
