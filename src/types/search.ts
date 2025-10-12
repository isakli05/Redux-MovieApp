/**
 * Search Type Definitions
 * Arama sonuçları için type tanımları
 */

import type { Result as Movie } from './Movies';
import type { Result as Tv } from './tvs';
import type { Result as Person } from './popularPersons';

// Temel arama sonucu yapısı
export interface SearchResults<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Multi search için item tipi (film, dizi veya kişi olabilir)
export interface MultiSearchItem {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  adult?: boolean;
  backdrop_path?: string | null;
  genre_ids?: number[];
  original_language?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  popularity: number;
  poster_path?: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  title?: string;
  name?: string;
  video?: boolean;
  vote_average?: number;
  vote_count?: number;
  known_for_department?: string;
  known_for?: (Movie | Tv)[];
  gender?: number;
}

// Multi search sonuç tipi
export interface MultiSearchResults {
  page: number;
  results: MultiSearchItem[];
  total_pages: number;
  total_results: number;
}

// Arama kategorisi
export type SearchCategory = 'all' | 'movie' | 'tv' | 'person';

// Arama filtre seçenekleri
export interface SearchFilters {
  category: SearchCategory;
  language?: 'tr' | 'en' | 'both';
  year?: number;
  includeAdult?: boolean;
}

// Birleştirilmiş arama sonuçları (Türkçe + İngilizce)
export interface CombinedSearchResults {
  movies: Movie[];
  tvShows: Tv[];
  persons: Person[];
  totalResults: number;
}

// Arama önerisi (autocomplete için)
export interface SearchSuggestion {
  id: number;
  title: string;
  subtitle?: string;
  type: 'movie' | 'tv' | 'person';
  image?: string;
  year?: string;
}

// Arama geçmişi
export interface SearchHistory {
  query: string;
  timestamp: number;
  category?: SearchCategory;
}

