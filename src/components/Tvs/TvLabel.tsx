import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TagIcon } from '@heroicons/react/24/outline';
import { extractIdFromSlug, slugify } from '../../utils';
import type { TvLabels } from '../../types/tvLabel';
import { TMDB_CONFIG } from '../../utils/constants';

function TvLabel() {
  const { id } = useParams();
  const tvId = extractIdFromSlug(id);
  const [tvLabel, setTvLabel] = useState<TvLabels>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tvId) return;

    setIsLoading(true);
    fetch(`${TMDB_CONFIG.BASE_URL}/tv/${tvId}/keywords?api_key=${TMDB_CONFIG.API_KEY}`)
      .then((res) => res.json())
      .then((data) => setTvLabel(data))
      .finally(() => setIsLoading(false));
  }, [tvId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-blue-400" />
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
        <TagIcon className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-bold text-white">Anahtar Kelimeler</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tvLabel?.results && tvLabel.results.length > 0 ? (
          tvLabel.results.map((key) => (
            <Link
              key={key.id}
              to={`/keyword/${key.id}-${slugify(key.name)}/tv`}
              className="group relative px-4 py-2 bg-slate-700/50 hover:bg-blue-500/20 border border-slate-600/50 hover:border-blue-500/50 rounded-lg text-slate-300 hover:text-blue-400 text-sm font-medium transition-all duration-300"
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

export default TvLabel;
