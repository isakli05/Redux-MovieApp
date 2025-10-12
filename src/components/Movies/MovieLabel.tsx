import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TagIcon } from '@heroicons/react/24/outline';
import { extractIdFromSlug, slugify } from '../../utils';
import type { MovieLabels } from '../../types/movieLabel';
import { TMDB_CONFIG } from '../../utils/constants';

function MovieLabel() {
  const { id } = useParams();
  const movieId = extractIdFromSlug(id);
  const [movieLabel, setMovieLabel] = useState<MovieLabels>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!movieId) return;

    setIsLoading(true);
    fetch(`${TMDB_CONFIG.BASE_URL}/movie/${movieId}/keywords?api_key=${TMDB_CONFIG.API_KEY}`)
      .then((res) => res.json())
      .then((data) => setMovieLabel(data))
      .finally(() => setIsLoading(false));
  }, [movieId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Anahtar Kelimeler</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-9 w-20 bg-slate-700/50 rounded-lg animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TagIcon className="h-5 w-5 text-cyan-400" />
        <h3 className="text-lg font-bold text-white">Anahtar Kelimeler</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {movieLabel?.keywords && movieLabel.keywords.length > 0 ? (
          movieLabel.keywords.map((key) => (
            <Link
              key={key.id}
              to={`/keyword/${key.id}-${slugify(key.name)}/movie`}
              className="group relative px-4 py-2 bg-slate-700/50 hover:bg-cyan-500/20 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg text-slate-300 hover:text-cyan-400 text-sm font-medium transition-all duration-300"
            >
              <span className="relative z-10">{key.name}</span>
            </Link>
          ))
        ) : (
          <p className="text-slate-400 text-sm italic">Hiç anahtar kelime eklenmedi.</p>
        )}
      </div>
    </div>
  );
}

export default MovieLabel;
