export interface SeasonVideo {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: 'Trailer' | 'Teaser' | 'Clip' | 'Behind the Scenes' | 'Featurette' | 'Bloopers';
  official: boolean;
  published_at: string;
}

export interface SeasonVideosResponse {
  id: number;
  results: SeasonVideo[];
}
