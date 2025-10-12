import { Link, useParams } from 'react-router-dom';
import { useGetTVShowDetailsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, extractIdFromSlug, getYear } from '../../utils';

function TvBanner() {
  const { id } = useParams();
  const tvId = extractIdFromSlug(id);
  const { data: tv, isLoading } = useGetTVShowDetailsQuery(tvId!, {
    skip: !tvId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center p-2 sm:p-5 h-32 my-5 bg-slate-500 animate-pulse">
        <div className="flex items-center md:ml-12">
          <div className="w-16 h-20 bg-slate-600 rounded mr-2" />
          <div className="ml-2 space-y-2">
            <div className="h-8 w-64 bg-slate-600 rounded" />
            <div className="h-4 w-32 bg-slate-600 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!tv) return null;

  return (
    <div className="flex items-center p-2 sm:p-5 h-32 my-5 bg-slate-500">
      <Link to={`/tv/${id}`}>
        <div className="flex items-center md:ml-12 group">
          <img
            loading="lazy"
            className="w-16 h-20 object-cover rounded shadow-md"
            src={getPosterUrl(tv.poster_path)}
            alt={tv.name}
          />

          <div className="ml-4">
            <h3 className="font-semibold text-xl md:text-3xl text-gray-100 group-hover:text-gray-300 transition-colors">
              {tv.original_name}{' '}
              <span className="md:text-2xl font-light">
                ({getYear(tv.first_air_date)})
              </span>
            </h3>
            <span className="text-gray-100 group-hover:text-slate-300 text-sm md:text-base transition-colors">
              <i className="fa-solid fa-arrow-left mr-2 text-sm"></i>
              Sayfaya Dön
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default TvBanner;
