import { Link, useParams } from 'react-router-dom';
import { useGetTVSeasonDetailsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, formatDate, formatDuration, extractIdFromSlug } from '../../utils';
import TvSeasonBanner from '../../components/Tvs/TvSeasonBanner';
import Loading from '../../components/Loading';

function TvSeasonDetail() {
  const { tv_id, season_number } = useParams<{ tv_id: string; season_number: string }>();
  const tvId = extractIdFromSlug(tv_id);

  const { data: seasonDetail, isLoading } = useGetTVSeasonDetailsQuery(
    { tvId: tvId!, seasonNumber: Number(season_number) },
    { skip: !tvId || !season_number }
  );

  if (isLoading || !seasonDetail) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <TvSeasonBanner />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {seasonDetail.episodes?.map((episode) => (
            <div
              key={episode.id}
              className="flex flex-col md:flex-row gap-6 p-6 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              {/* Episode Image */}
              <div className="flex-shrink-0">
                <img
                  loading="lazy"
                  className="w-full md:w-64 h-48 md:h-36 rounded-md object-cover"
                  src={getPosterUrl(episode.still_path)}
                  alt={episode.name}
                />
              </div>

              {/* Episode Info */}
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-100">
                    {episode.episode_number}. {episode.name}
                  </h3>
                  {episode.runtime && (
                    <span className="text-slate-400 text-sm whitespace-nowrap ml-4">
                      {formatDuration(episode.runtime)}
                    </span>
                  )}
                </div>

                <div className="flex gap-4 text-sm text-slate-400">
                  {episode.air_date && (
                    <span>{formatDate(episode.air_date)}</span>
                  )}
                  {episode.vote_average > 0 && (
                    <span>⭐ {episode.vote_average.toFixed(1)}</span>
                  )}
                </div>

                {episode.overview && (
                  <p className="text-gray-300 leading-relaxed">
                    {episode.overview}
                  </p>
                )}

                {episode.guest_stars && episode.guest_stars.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">
                      Konuk Oyuncular:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {episode.guest_stars.slice(0, 5).map((star) => (
                        <Link
                          key={star.id}
                          to={`/person/${star.id}`}
                          className="text-sm text-cyan-400 hover:text-cyan-300"
                        >
                          {star.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {seasonDetail.episodes?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Bu sezon için bölüm bilgisi bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TvSeasonDetail;
