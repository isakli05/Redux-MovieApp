import { Link, useParams } from 'react-router-dom';
import { useGetTVShowDetailsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, formatDate, extractIdFromSlug } from '../../utils';
import TvSeasonListBanner from '../../components/Tvs/TvSeasonListBanner';
import Loading from '../../components/Loading';

function TvSeasonsList() {
  const { tv_id } = useParams();
  const tvId = extractIdFromSlug(tv_id);

  const { data: tvDetail, isLoading } = useGetTVShowDetailsQuery(tvId!, {
    skip: !tvId,
  });

  if (isLoading || !tvDetail) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <TvSeasonListBanner tv_id={tv_id!} />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {tvDetail.seasons.map((season) => (
            <Link
              key={season.id}
              to={`/tv/${tv_id}/season/${season.season_number}`}
              className="flex flex-col md:flex-row gap-6 p-6 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors group"
            >
              {/* Season Poster */}
              <div className="flex-shrink-0">
                <img
                  loading="lazy"
                  className="w-32 md:w-24 h-48 md:h-36 rounded-md object-cover mx-auto"
                  src={getPosterUrl(season.poster_path)}
                  alt={season.name}
                />
              </div>

              {/* Season Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col md:flex-row md:items-start gap-2">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-100 group-hover:text-cyan-400 transition-colors">
                    {season.name}
                  </h2>
                  <div className="flex gap-3 text-sm text-gray-400">
                    {season.air_date && (
                      <span>{season.air_date.slice(0, 4)}</span>
                    )}
                    <span>{season.episode_count} Bölüm</span>
                  </div>
                </div>

                <p className="leading-relaxed text-gray-300">
                  {season.overview || 
                    `${tvDetail.name} ${season.season_number}. Sezon ${
                      season.air_date ? formatDate(season.air_date) : ''
                    }'de gösterime girdi.`
                  }
                </p>
              </div>
            </Link>
          ))}
        </div>

        {tvDetail.seasons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Sezon bilgisi bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TvSeasonsList;
