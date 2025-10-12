import { Link, useParams } from 'react-router-dom';
import { useGetTVSeasonDetailsQuery, useGetTVShowDetailsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, getYear, extractIdFromSlug } from '../../utils';

function TvSeasonBanner() {
  const { tv_id, season_number } = useParams<{ tv_id: string; season_number: string }>();
  const tvId = extractIdFromSlug(tv_id);

  const { data: seasonDetail } = useGetTVSeasonDetailsQuery(
    { tvId: tvId!, seasonNumber: Number(season_number) },
    { skip: !tvId || !season_number }
  );

  const { data: tvDetail } = useGetTVShowDetailsQuery(tvId!, {
    skip: !tvId,
  });

  return (
    <>
      <div className="flex items-center p-5 h-32 my-5 bg-slate-500">
        <div className="flex items-center lg:ml-11">
          <Link to={`/tv/${tv_id}/season/${season_number}`}>
            <img
              loading="lazy"
              className="w-16 h-20 object-cover rounded mr-2"
              src={getPosterUrl(seasonDetail?.poster_path)}
              alt={seasonDetail?.name}
            />
          </Link>
          <div className="ml-2">
            <div className="flex gap-2">
              <Link to={`/tv/${tv_id}/season/${season_number}`}>
                <h3 className="font-semibold text-xl md:text-3xl text-gray-100 hover:text-gray-300">
                  {seasonDetail?.name}
                </h3>
              </Link>
              {seasonDetail?.air_date && (
                <h5 className="text-xl md:text-3xl font-light text-gray-100">
                  ({getYear(seasonDetail.air_date)})
                </h5>
              )}
            </div>
            <Link to={`/tv/${tv_id}/seasons`}>
              <span className="text-gray-100 hover:text-slate-300 text-sm md:text-base">
                <i className="fa-solid fa-arrow-left mr-2 text-sm"></i>
                Sezon Listesine Dön
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-slate-700 flex justify-between px-10 py-3">
        <div>
          {Number(season_number) > 1 && (
            <Link to={`/tv/${tv_id}/season/${Number(season_number) - 1}`}>
              <h3 className="text-slate-300 hover:text-slate-100 text-lg">
                <i className="fa-solid fa-arrow-left mr-2 text-sm"></i>
                Sezon {Number(season_number) - 1}
              </h3>
            </Link>
          )}
        </div>
        <div>
          {tvDetail && Number(season_number) < tvDetail.number_of_seasons && (
            <Link to={`/tv/${tv_id}/season/${Number(season_number) + 1}`}>
              <h3 className="text-slate-300 hover:text-slate-100 text-lg">
                Sezon {Number(season_number) + 1}
                <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
              </h3>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export default TvSeasonBanner;
