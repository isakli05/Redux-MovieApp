import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useGetTVShowDetailsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, getYear, extractIdFromSlug } from '../../utils';

function TvSeasonListBanner({ tv_id }: { tv_id: string }) {
  const tvId = extractIdFromSlug(tv_id);
  
  const { data: tvDetail } = useGetTVShowDetailsQuery(tvId!, {
    skip: !tvId,
  });

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50">
      {/* Decorative blur circles */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="relative container mx-auto px-4 py-8">
        <Link 
          className="flex items-center gap-4 group w-fit" 
          to={`/tv/${tv_id}`}
        >
          <img
            loading="lazy"
            className="w-20 h-28 md:w-24 md:h-36 object-cover rounded-lg shadow-xl 
                       group-hover:shadow-2xl transition-shadow duration-300"
            src={getPosterUrl(tvDetail?.poster_path, 'MEDIUM')}
            alt={tvDetail?.name}
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="font-bold text-2xl md:text-4xl text-white 
                             group-hover:text-cyan-400 transition-colors">
                {tvDetail?.name}
              </h1>
              {tvDetail?.first_air_date && (
                <span className="text-lg md:text-2xl font-light text-slate-400">
                  ({getYear(tvDetail.first_air_date)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-cyan-400 
                            transition-colors text-sm md:text-base">
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="font-medium">Dizi Detayına Dön</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default TvSeasonListBanner;
