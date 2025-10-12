/**
 * TMDB API - Video Types
 * Film ve dizi videoları için tip tanımlamaları
 */

export interface Video {
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
  id: string;
}

export interface VideosResponse {
  id: number;
  results: Video[];
}

export type VideoType = 
  | 'Trailer' 
  | 'Teaser' 
  | 'Clip' 
  | 'Behind the Scenes' 
  | 'Bloopers' 
  | 'Featurette';

