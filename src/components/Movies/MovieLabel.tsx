import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
      <div>
        <h3 className="text-xl font-semibold mb-2">Etiketler</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-8 w-20 bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Etiketler</h3>
      <div className="flex flex-wrap gap-2">
        {movieLabel?.keywords && movieLabel.keywords.length > 0 ? (
          movieLabel.keywords.map((key) => (
            <Link
              key={key.id}
              to={`/keyword/${key.id}-${slugify(key.name)}/movie`}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-thin px-3 py-2 rounded-lg transition-colors"
            >
              {key.name}
            </Link>
          ))
        ) : (
          <p className="text-slate-400 text-sm">Hiç anahtar kelime eklenmedi.</p>
        )}
      </div>
    </div>
  );
}

export default MovieLabel;
