/**
 * TMDB API - Media Types
 * Comprehensive type definitions for images and media gallery
 */

// Image Types
export interface TMDBImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface ImagesResponse {
  id: number;
  backdrops: TMDBImage[];
  logos: TMDBImage[];
  posters: TMDBImage[];
}

export interface PersonImagesResponse {
  id: number;
  profiles: TMDBImage[];
}

// Media Gallery Types
export type MediaType = 'movie' | 'tv' | 'season' | 'person';
export type ImageCategory = 'posters' | 'backdrops' | 'logos' | 'profiles';
export type MediaTab = 'videos' | ImageCategory;

export interface MediaGalleryProps {
  mediaType: MediaType;
  id: string;
  seasonNumber?: number;
  defaultTab?: MediaTab;
  gender?: number; // 1: Female, 2: Male (for person pages)
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  language: string | null;
  voteAverage: number;
  voteCount: number;
}

// Sort and Filter Types
export type SortOption = 'vote_average' | 'vote_count' | 'width' | 'height';
export type FilterLanguage = 'all' | 'en' | 'tr' | 'null';
export type ViewMode = 'grid' | 'masonry';
