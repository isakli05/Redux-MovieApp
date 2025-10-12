import { Link } from 'react-router-dom';
import { useGetTVShowRecommendationsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, createSlug } from '../../utils';

type TvRecommendationProps = {
  id?: string;
  name?: string;
};

function TvRecommendation({ id, name }: TvRecommendationProps) {
  const { data: tvRecom, isLoading } = useGetTVShowRecommendationsQuery(id!, {
    skip: !id,
  });

  if (isLoading) return null;

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-2xl text-left text-zinc-300 font-semibold">
        Tavsiyeler
      </h3>

      {tvRecom?.results.length === 0 ? (
        <p className="text-slate-400 text-center py-8">
          {name} dizisine dayalı öneriler için yeterli veri yok. İzlediğiniz dizileri oylayarak yardımcı olabilirsiniz.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {tvRecom?.results.slice(0, 10).map((tv) => (
            <Link
              key={tv.id}
              to={`/tv/${createSlug(tv.id, tv.original_name)}`}
              className="flex-shrink-0 w-64 hover:scale-105 transition-transform duration-200"
            >
              <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
                <img
                  loading="lazy"
                  className="h-36 w-full object-cover object-center"
                  src={getPosterUrl(tv.poster_path)}
                  alt={tv.name}
                />
                <div className="p-3">
                  <p className="text-slate-300 font-medium truncate">
                    {tv.name}
                  </p>
                  {tv.vote_average > 0 && (
                    <p className="text-slate-500 text-sm mt-1">
                      ⭐ {tv.vote_average.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default TvRecommendation;
