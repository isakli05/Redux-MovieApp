import { Link } from 'react-router-dom';
import { useGetTVShowDetailsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, getYear, extractIdFromSlug } from '../../utils';

function TvSeasonListBanner({ tv_id }: { tv_id: string }) {
  const tvId = extractIdFromSlug(tv_id);
  
  const { data: tvDetail } = useGetTVShowDetailsQuery(tvId!, {
    skip: !tvId,
  });

  return (
    <div className="flex items-center p-2 sm:p-5 h-32 my-5 bg-slate-600">
      <Link className="flex items-center ml-5 md:ml-12 group" to={`/tv/${tv_id}`}>
        <img
          loading="lazy"
          className="w-16 h-20 object-cover rounded shadow-md"
          src={getPosterUrl(tvDetail?.poster_path)}
          alt={tvDetail?.name}
        />
        <div className="ml-4">
          <div className="flex gap-2">
            <h3 className="font-semibold text-lg md:text-3xl text-gray-100 group-hover:text-gray-300 transition-colors">
              {tvDetail?.name}
            </h3>
            {tvDetail?.first_air_date && (
              <h5 className="text-sm md:text-2xl font-light text-gray-100 mt-1">
                ({getYear(tvDetail.first_air_date)})
              </h5>
            )}
          </div>
          <span className="text-gray-100 group-hover:text-slate-300 text-sm md:text-base transition-colors">
            <i className="fa-solid fa-arrow-left mr-2 text-sm"></i>
            Ana Sayfaya Dön
          </span>
        </div>
      </Link>
    </div>
  );
}

export default TvSeasonListBanner;
