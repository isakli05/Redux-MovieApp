import { Link, useParams } from 'react-router-dom';
import { useGetTVShowCreditsQuery } from '../../api/endpoints/tv.endpoints';
import { getProfileUrl, extractIdFromSlug } from '../../utils';
import TvBanner from '../../components/Tvs/TvBanner';
import Loading from '../../components/Loading';

function TvCast() {
  const { id } = useParams<{ id: string }>();
  const tvId = extractIdFromSlug(id);
  
  const { data: tvCredit, isLoading } = useGetTVShowCreditsQuery(tvId!, {
    skip: !tvId,
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="dark:bg-slate-900 min-h-screen">
      <TvBanner />
      <div className="flex flex-col lg:flex-row gap-8 px-4 lg:px-16">
        {/* Cast */}
        <div className="lg:w-1/2">
          <h3 className="text-2xl md:text-3xl text-left text-zinc-300 font-medium md:font-semibold mb-4">
            Oyuncular <span className="text-slate-400 text-xl">{tvCredit?.cast.length}</span>
          </h3>
          <ul className="space-y-4">
            {tvCredit?.cast.map((cast) => (
              <Link key={cast.id} to={`/person/${cast.id}`}>
                <li className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <img
                    loading="lazy"
                    className="w-16 h-20 object-cover rounded-md"
                    src={getProfileUrl(cast.profile_path)}
                    alt={cast.name}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-100">{cast.original_name}</p>
                    <span className="text-sm font-light text-slate-400">
                      {cast.character || cast.roles?.[0]?.character}
                    </span>
                    {cast.total_episode_count && (
                      <span className="block text-xs text-slate-500 mt-1">
                        {cast.total_episode_count} Bölüm
                      </span>
                    )}
                  </div>
                </li>
              </Link>
            ))}
          </ul>
        </div>

        {/* Crew */}
        <div className="lg:w-1/2">
          <h3 className="text-2xl md:text-3xl text-left text-zinc-300 font-medium md:font-semibold mb-4">
            Ekip <span className="text-slate-400 text-xl">{tvCredit?.crew.length}</span>
          </h3>
          <ul className="space-y-4">
            {tvCredit?.crew.map((crew) => (
              <Link key={`${crew.id}-${crew.credit_id}`} to={`/person/${crew.id}`}>
                <li className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <img
                    loading="lazy"
                    className="w-16 h-20 object-cover rounded-md"
                    src={getProfileUrl(crew.profile_path)}
                    alt={crew.name}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-100">{crew.original_name}</p>
                    <span className="text-sm font-light text-slate-400">{crew.job}</span>
                  </div>
                </li>
              </Link>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TvCast;
