import { Link } from 'react-router-dom';
import { UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useGetTVShowCreditsQuery } from '../../api/endpoints/tv.endpoints';
import { getProfileUrl, extractIdFromSlug } from '../../utils';

type TvCreditProps = {
  id?: string;
};

function TvCredit({ id }: TvCreditProps) {
  const tvId = extractIdFromSlug(id);
  const { data: tvCredits, isLoading } = useGetTVShowCreditsQuery(tvId!, {
    skip: !tvId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Başrol Oyuncuları
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-40 animate-pulse">
              <div className="aspect-[2/3] bg-slate-700/50 rounded-xl mb-3 animate-shimmer" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-700/50 rounded w-full" />
                <div className="h-3 bg-slate-700/50 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full" />
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Başrol Oyuncuları
        </h2>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
          {tvCredits?.cast.slice(0, 9).map((cast) => (
            <Link
              key={cast.id}
              to={`/person/${cast.id}`}
              className="group flex-shrink-0 w-40 snap-start"
            >
              <div className="relative">
                {/* Cast Card */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-300 mb-3">
                  {/* Episodes Badge */}
                  {cast.total_episode_count && (
                    <div className="absolute top-3 right-3 z-10 px-2.5 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg">
                      <span className="text-white text-xs font-bold">
                        {cast.total_episode_count} Bölüm
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-100 z-10">
                    <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                      <p className="text-white font-semibold text-sm line-clamp-2 leading-tight">
                        {cast.original_name}
                      </p>
                      <p className="text-blue-400 text-xs line-clamp-1">
                        {cast.character || cast.roles?.[0]?.character}
                      </p>
                    </div>
                  </div>

                  {/* Profile Image */}
                  <img
                    loading="lazy"
                    src={getProfileUrl(cast.profile_path)}
                    alt={cast.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Name & Character (Desktop) */}
                <div className="space-y-1">
                  <p className="text-white font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                    {cast.original_name}
                  </p>
                  <p className="text-slate-400 text-xs line-clamp-1">
                    {cast.character || cast.roles?.[0]?.character}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {/* View All Card */}
          <Link
            to={`/tv/${tvId}/cast`}
            className="group flex-shrink-0 w-40 snap-start"
          >
            <div className="aspect-[2/3] rounded-xl bg-slate-800/50 backdrop-blur-lg border-2 border-dashed border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 flex flex-col items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <UserGroupIcon className="h-6 w-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-white font-semibold text-sm">Tümünü Gör</p>
                <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 mx-auto group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </div>

        {/* Scroll Hint */}
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export default TvCredit;
