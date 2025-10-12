import { Link } from 'react-router-dom';
import { useGetMovieCreditsQuery } from '../../api/endpoints/movies.endpoints';
import { getProfileUrl, extractIdFromSlug } from '../../utils';

type MovieCreditProps = {
  id?: string;
};

function MovieCredit({ id }: MovieCreditProps) {
  const movieId = extractIdFromSlug(id);
  const { data: movieCredits, isLoading } = useGetMovieCreditsQuery(movieId!, {
    skip: !movieId,
  });

  if (isLoading) {
    return (
      <div className="bg-slate-900 py-2">
        <h3 className="text-3xl text-left text-zinc-300 font-semibold">
          Başrol Oyuncuları
        </h3>
        <ul className="flex mt-3 gap-2 overflow-x-auto">
          {Array.from({ length: 9 }).map((_, index) => (
            <li key={index} className="flex flex-col w-[140px] shadow rounded-lg animate-pulse">
              <div className="h-44 w-[140px] bg-slate-700 rounded-t-lg" />
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
        Başrol Oyuncuları
      </h3>

      <ul className="flex mt-3 overflow-x-auto overflow-y-hidden gap-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {movieCredits?.cast.slice(0, 9).map((cast) => (
          <li
            key={cast.id}
            className="flex flex-col w-[140px] shadow rounded-lg hover:scale-105 transition-transform duration-200"
          >
            <Link to={`/person/${cast.id}`}>
              <figure className="flex flex-col">
                <img
                  loading="lazy"
                  className="h-44 w-[140px] object-cover rounded-t-lg"
                  src={getProfileUrl(cast.profile_path)}
                  alt={cast.name}
                />
                <div className="flex flex-col p-2 space-y-1">
                  <p className="font-semibold text-slate-100 truncate">
                    {cast.original_name}
                  </p>
                  <span className="text-sm font-light text-slate-400 truncate">
                    {cast.character}
                  </span>
                </div>
              </figure>
            </Link>
          </li>
        ))}
        
        <Link to={`/movie/${movieId}/cast`}>
          <li className="flex flex-col text-center h-44 w-[140px] items-center justify-center hover:text-slate-400 duration-200 text-slate-200 cursor-pointer">
            <span>Tümünü Gör</span>
            <i className="fa-solid fa-arrow-right mt-2"></i>
          </li>
        </Link>
      </ul>
    </div>
  );
}

export default MovieCredit;
