import { Link } from 'react-router-dom';
import { SparklesIcon, StarIcon } from '@heroicons/react/24/solid';
import { useGetMovieRecommendationsQuery } from '../../api/endpoints/movies.endpoints';
import { getBackdropUrl, createSlug, extractIdFromSlug } from '../../utils';

type MovieRecommendationProps = {
  id?: string;
};

function MovieRecommendation({ id }: MovieRecommendationProps) {
  const movieId = extractIdFromSlug(id);
  const { data: recommendations, isLoading } = useGetMovieRecommendationsQuery(movieId!, {
    skip: !movieId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Öneriler
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-72 animate-pulse">
              <div className="aspect-video bg-slate-700/50 rounded-xl mb-3 animate-shimmer" />
              <div className="h-4 bg-slate-700/50 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations?.results.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full" />
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          Öneriler
          <SparklesIcon className="h-6 w-6 text-purple-400" />
        </h2>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
          {recommendations.results.map((movie) => (
            <Link
              key={movie.id}
              to={`/movie/${createSlug(movie.id, movie.original_title)}`}
              className="group flex-shrink-0 w-72 snap-start"
            >
              <div className="relative">
                {/* Movie Card */}
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:shadow-purple-500/20 transition-all duration-300 mb-3">
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span className="text-white text-sm font-bold">
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold line-clamp-2 leading-tight">
                        {movie.title}
                      </h3>
                    </div>
                  </div>

                  {/* Backdrop Image */}
                  <img
                    loading="lazy"
                    src={getBackdropUrl(movie.backdrop_path)}
                    alt={movie.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Title */}
                <p className="text-white font-semibold line-clamp-2 leading-tight group-hover:text-purple-400 transition-colors">
                  {movie.title}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Scroll Hint */}
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export default MovieRecommendation;
