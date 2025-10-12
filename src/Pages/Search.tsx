/**
 * Search Page
 * Arama sonuçlarını gösteren ana sayfa
 * Hem Türkçe hem İngilizce sonuçları birleştirir
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  FilmIcon,
  TvIcon,
  UserIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useSearchMultiQuery, useSearchMultiENQuery } from '@api/index';
import SearchResults from '@components/Search/SearchResults';
import type { MultiSearchItem, SearchCategory } from '../types/search';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('q') || '';
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<SearchCategory>('all');
  const [language, setLanguage] = useState<'tr' | 'en' | 'both'>('both');

  // Türkçe arama
  const { 
    data: dataTR, 
    isLoading: isLoadingTR,
    isFetching: isFetchingTR 
  } = useSearchMultiQuery(
    { query, page },
    { skip: !query || query.length < 2 || language === 'en' }
  );

  // İngilizce arama
  const { 
    data: dataEN, 
    isLoading: isLoadingEN,
    isFetching: isFetchingEN 
  } = useSearchMultiENQuery(
    { query, page },
    { skip: !query || query.length < 2 || language === 'tr' }
  );

  // Sonuçları birleştir ve duplicate'leri temizle
  const combinedResults = useMemo(() => {
    const allResults: MultiSearchItem[] = [];
    const seenIds = new Set<string>();

    // Türkçe sonuçları ekle
    if (dataTR?.results) {
      dataTR.results.forEach((item: MultiSearchItem) => {
        const key = `${item.media_type}-${item.id}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          allResults.push(item);
        }
      });
    }

    // İngilizce sonuçları ekle (duplicate değilse)
    if (dataEN?.results) {
      dataEN.results.forEach((item: MultiSearchItem) => {
        const key = `${item.media_type}-${item.id}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          allResults.push(item);
        }
      });
    }

    // Popülerlik ve rating'e göre sırala
    return allResults.sort((a, b) => {
      // Önce rating'e göre
      const ratingA = a.vote_average || 0;
      const ratingB = b.vote_average || 0;
      if (Math.abs(ratingA - ratingB) > 1) {
        return ratingB - ratingA;
      }
      // Sonra popülerliğe göre
      return b.popularity - a.popularity;
    });
  }, [dataTR, dataEN]);

  // Kategoriye göre filtrele
  const filteredResults = useMemo(() => {
    if (category === 'all') return combinedResults;
    return combinedResults.filter((item) => item.media_type === category);
  }, [combinedResults, category]);

  // Her kategorideki sonuç sayıları
  const categoryCounts = useMemo(() => {
    return {
      all: combinedResults.length,
      movie: combinedResults.filter((item) => item.media_type === 'movie').length,
      tv: combinedResults.filter((item) => item.media_type === 'tv').length,
      person: combinedResults.filter((item) => item.media_type === 'person').length,
    };
  }, [combinedResults]);

  // Loading durumu
  const isLoading = isLoadingTR || isLoadingEN;
  const isFetching = isFetchingTR || isFetchingEN;

  // Query değiştiğinde sayfayı sıfırla
  useEffect(() => {
    setPage(1);
  }, [query]);

  // Boş query ile gelindiyse ana sayfaya yönlendir
  useEffect(() => {
    if (!query) {
      navigate('/');
    }
  }, [query, navigate]);

  // Kategori değişimi
  const handleCategoryChange = (newCategory: SearchCategory) => {
    setCategory(newCategory);
    setPage(1);
  };

  // Dil değişimi
  const handleLanguageChange = (newLanguage: 'tr' | 'en' | 'both') => {
    setLanguage(newLanguage);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MagnifyingGlassIcon className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">
              Arama Sonuçları
            </h1>
          </div>
          
          {query && (
            <p className="text-gray-400 text-lg">
              "<span className="text-white font-semibold">{query}</span>" için{' '}
              <span className="text-cyan-400 font-semibold">
                {filteredResults.length}
              </span>{' '}
              sonuç bulundu
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Kategori Filtreleri */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                category === 'all'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" />
              Tümü ({categoryCounts.all})
            </button>
            <button
              onClick={() => handleCategoryChange('movie')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                category === 'movie'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <FilmIcon className="h-5 w-5" />
              Filmler ({categoryCounts.movie})
            </button>
            <button
              onClick={() => handleCategoryChange('tv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                category === 'tv'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <TvIcon className="h-5 w-5" />
              Diziler ({categoryCounts.tv})
            </button>
            <button
              onClick={() => handleCategoryChange('person')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                category === 'person'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <UserIcon className="h-5 w-5" />
              Kişiler ({categoryCounts.person})
            </button>
          </div>

          {/* Dil Filtreleri */}
          <div className="flex items-center gap-3">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
            <span className="text-gray-400 text-sm font-medium">Dil:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange('both')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  language === 'both'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Her İkisi
              </button>
              <button
                onClick={() => handleLanguageChange('tr')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  language === 'tr'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                Türkçe
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  language === 'en'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                İngilizce
              </button>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {isFetching && (
          <div className="mb-4 flex items-center gap-2 text-cyan-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <span className="text-sm font-medium">Yükleniyor...</span>
          </div>
        )}

        {/* Results */}
        <SearchResults results={filteredResults} isLoading={isLoading && !isFetching} />

        {/* Empty State */}
        {!isLoading && !isFetching && query && filteredResults.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Sonuç Bulunamadı
            </h3>
            <p className="text-gray-400 mb-6">
              "<span className="text-white">{query}</span>" için hiçbir sonuç bulunamadı
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Arama terimini kontrol edin</p>
              <p>• Daha genel kelimeler kullanmayı deneyin</p>
              <p>• Farklı bir kategori seçmeyi deneyin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

