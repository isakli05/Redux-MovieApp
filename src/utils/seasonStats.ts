import type { Season } from '../types/tvsDetails';

export interface SeasonStats {
  totalSeasons: number;
  totalEpisodes: number;
  averageRating: number;
  highestRatedSeason: Season | null;
}

export const calculateSeasonStats = (seasons: Season[]): SeasonStats => {
  if (!seasons || seasons.length === 0) {
    return {
      totalSeasons: 0,
      totalEpisodes: 0,
      averageRating: 0,
      highestRatedSeason: null,
    };
  }

  // Calculate total episodes
  const totalEpisodes = seasons.reduce((sum, season) => sum + (season.episode_count || 0), 0);

  // Calculate average rating (only from seasons with vote_average)
  const seasonsWithRating = seasons.filter(s => s.vote_average && s.vote_average > 0);
  const averageRating = seasonsWithRating.length > 0
    ? seasonsWithRating.reduce((sum, season) => sum + (season.vote_average || 0), 0) / seasonsWithRating.length
    : 0;

  // Find highest rated season
  const highestRatedSeason = seasonsWithRating.length > 0
    ? seasonsWithRating.reduce((highest, season) => 
        (season.vote_average || 0) > (highest.vote_average || 0) ? season : highest
      )
    : null;

  return {
    totalSeasons: seasons.length,
    totalEpisodes,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    highestRatedSeason,
  };
};
