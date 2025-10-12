import { Link } from 'react-router-dom';
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
      <div className="bg-slate-900 py-2">
        <h3 className="text-3xl text-left text-zinc-300 font-semibold">
          Dizi Oyuncuları
        </h3>
        <ul className="flex mt-3 gap-2 overflow-x-auto">
          {Array.from({ length: 9 }).map((_, index) => (
            <li key={index} className="flex flex-col w-36 shadow rounded-lg animate-pulse">
              <div className="h-44 bg-slate-700 rounded-md" />
              <div className="p-2 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-700 rounded w-3/4" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 py-2">
      <h3 className="text-3xl text-left text-zinc-300 font-semibold">
        Dizi Oyuncuları
      </h3>
      <ul className="flex mt-3 overflow-x-auto overflow-y-hidden gap-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {tvCredits?.cast.slice(0, 9).map((cast) => (
          <Link key={cast.id} to={`/person/${cast.id}`}>
            <li className="flex flex-col w-36 shadow rounded-lg mb-3 hover:scale-105 transition-transform duration-200">
              <figure className="flex flex-col">
                <img
                  loading="lazy"
                  className="h-44 w-36 object-cover rounded-t-lg"
                  src={getProfileUrl(cast.profile_path)}
                  alt={cast.name}
                />
                <div className="flex flex-col p-2 space-y-1">
                  <p className="font-semibold text-slate-100 truncate">
                    {cast.original_name}
                  </p>
                  <span className="text-sm font-light text-slate-400 truncate">
                    {cast.character || cast.roles?.[0]?.character}
                  </span>
                  {cast.total_episode_count && (
                    <span className="text-xs font-light text-slate-500">
                      {cast.total_episode_count} Bölüm
                    </span>
                  )}
                </div>
              </figure>
            </li>
          </Link>
        ))}
        <Link to={`/tv/${tvId}/cast`}>
          <li className="flex flex-col text-center h-44 w-36 items-center justify-center hover:text-slate-400 duration-200 text-slate-200 cursor-pointer">
            <span>Tümünü Gör</span>
            <i className="fa-solid fa-arrow-right mt-2"></i>
          </li>
        </Link>
      </ul>
    </div>
  );
}

export default TvCredit;
