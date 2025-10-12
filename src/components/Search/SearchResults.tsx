/**
 * SearchResults Component
 * Arama sonuçlarını grid layout'da gösteren component
 */

import { Link } from 'react-router-dom';
import { CalendarIcon, StarIcon, FilmIcon, TvIcon, UserIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '@utils/image.utils';
import { formatDate } from '@utils/date.utils';
import type { MultiSearchItem } from '../../types/search';

interface SearchResultsProps {
  results: MultiSearchItem[];
  isLoading?: boolean;
}

export default function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-slate-800 rounded-lg aspect-[2/3]" />
            <div className="mt-2 h-4 bg-slate-800 rounded" />
            <div className="mt-1 h-3 bg-slate-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Sonuç Bulunamadı
        </h3>
        <p className="text-gray-400">
          Farklı bir arama terimi deneyin
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {results.map((item) => (
        <SearchResultCard key={`${item.media_type}-${item.id}`} item={item} />
      ))}
    </div>
  );
}

// Tekil sonuç kartı
function SearchResultCard({ item }: { item: MultiSearchItem }) {
  // Link oluştur
  const getLink = () => {
    if (item.media_type === 'movie') return `/movie/${item.id}`;
    if (item.media_type === 'tv') return `/tv/${item.id}`;
    if (item.media_type === 'person') return `/person/${item.id}`;
    return '#';
  };

  // Başlık
  const title = item.title || item.name || 'İsimsiz';

  // Tarih
  const date = item.release_date || item.first_air_date;

  // Resim
  const imageUrl = item.media_type === 'person'
    ? item.profile_path
      ? getImageUrl(item.profile_path, 'w185')
      : '/assets/nullUser.svg'
    : item.poster_path
      ? getImageUrl(item.poster_path, 'w342')
      : '/assets/tv_null.svg';

  // Media type ikonu
  const MediaIcon = item.media_type === 'movie' ? FilmIcon 
    : item.media_type === 'tv' ? TvIcon 
    : UserIcon;

  return (
    <Link
      to={getLink()}
      className="group relative overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105"
    >
      {/* Resim Container */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-slate-800">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = item.media_type === 'person' 
              ? '/assets/nullUser.svg' 
              : '/assets/tv_null.svg';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Media Type Badge */}
        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
          <MediaIcon className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-white font-medium capitalize">
            {item.media_type === 'movie' ? 'Film' 
              : item.media_type === 'tv' ? 'Dizi' 
              : 'Kişi'}
          </span>
        </div>

        {/* Rating (sadece film ve diziler için) */}
        {item.vote_average && item.vote_average > 0 && item.media_type !== 'person' && (
          <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-xs text-white font-semibold">
              {item.vote_average.toFixed(1)}
            </span>
          </div>
        )}

        {/* Hover Info (sadece film ve diziler için) */}
        {item.overview && (
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-white text-xs line-clamp-3">
              {item.overview}
            </p>
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="mt-3 space-y-1">
        {/* Başlık */}
        <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-cyan-400 transition-colors">
          {title}
        </h3>

        {/* Tarih veya Departman */}
        {date ? (
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <CalendarIcon className="h-3 w-3" />
            <span>{formatDate(date)}</span>
          </div>
        ) : item.known_for_department ? (
          <div className="text-gray-400 text-xs">
            {item.known_for_department}
          </div>
        ) : null}

        {/* Popülerlik */}
        {item.popularity && (
          <div className="text-gray-500 text-xs">
            Popülerlik: {Math.round(item.popularity)}
          </div>
        )}
      </div>
    </Link>
  );
}

