import { Link, useParams } from 'react-router-dom';
import { useGetTVShowDetailsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, formatDate, extractIdFromSlug } from '../../utils';

function TvSeasonsBackdrops() {
  const { id } = useParams();
  const tvId = extractIdFromSlug(id);

  const { data: tvDetail } = useGetTVShowDetailsQuery(tvId!, {
    skip: !tvId,
  });

  if (!tvDetail || !tvDetail.seasons || tvDetail.seasons.length === 0) {
    return null;
  }

  // Get the latest season (usually the last one, excluding "Specials")
  const currentSeason = tvDetail.seasons
    .filter(season => season.season_number > 0)
    .sort((a, b) => b.season_number - a.season_number)[0] || tvDetail.seasons[0];

  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-2xl text-left text-zinc-300 font-semibold">
          Şuanki Sezon
        </h3>
        <Link
          to={`/tv/${id}/seasons`}
          className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          Tüm Sezonları Gör →
        </Link>
      </div>

      <Link
        to={`/tv/${id}/season/${currentSeason.season_number}`}
        className="flex gap-6 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors group"
      >
        {/* Poster */}
        <figure className="flex-shrink-0">
          <img
            loading="lazy"
            src={getPosterUrl(currentSeason.poster_path)}
            className="h-48 w-32 object-cover rounded-lg shadow-md"
            alt={currentSeason.name}
          />
        </figure>

        {/* Season Info */}
        <div className="flex-1 space-y-3 text-zinc-300">
          <h4 className="text-xl font-semibold group-hover:text-cyan-400 transition-colors">
            {currentSeason.name}
          </h4>

          <div className="flex gap-3 text-sm text-slate-400">
            {currentSeason.air_date && (
              <span>{currentSeason.air_date.slice(0, 4)}</span>
            )}
            <span>•</span>
            <span>{currentSeason.episode_count} Bölüm</span>
          </div>

          {currentSeason.overview ? (
            <p className="text-slate-300 leading-relaxed line-clamp-3">
              {currentSeason.overview}
            </p>
          ) : (
            <p className="text-slate-400 leading-relaxed">
              {tvDetail.name} dizisinin {currentSeason.season_number}. sezonu
              {currentSeason.air_date && (
                <> {formatDate(currentSeason.air_date)} tarihinde gösterime girdi</>
              )}.
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default TvSeasonsBackdrops;
