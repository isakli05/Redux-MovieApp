import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAiringTodayTVShowsQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, createSlug, formatDate } from '../../utils';

function AiringToday() {
  const [page, setPage] = useState(1);
  const { data: tvShows, isLoading, isFetching } = useGetAiringTodayTVShowsQuery(page);

  const handleLoadMore = () => {
    if (tvShows && page < tvShows.total_pages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="dark:bg-slate-900 min-h-screen">
      <aside className="px-10 py-2">
        <h2 className="text-2xl font-semibold text-zinc-300">
          Bugün Yayınlanan TV Şovları
        </h2>
      </aside>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4">
        {isLoading && page === 1 ? (
          Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="animate-pulse p-4 rounded">
              <div className="bg-slate-700 h-[337px] rounded-md mb-2" />
              <div className="bg-slate-700 h-6 rounded mb-2" />
              <div className="bg-slate-700 h-4 rounded w-2/3" />
            </div>
          ))
        ) : (
          tvShows?.results.map((tv) => (
            <div
              key={tv.id}
              className="cursor-pointer shadow dark:drop-shadow-2xl p-4 rounded hover:scale-105 transition-transform duration-200"
            >
              <article className="flex flex-col">
                <Link to={`/tv/${createSlug(tv.id, tv.original_name)}`}>
                  <div className="lg:h-[337px]">
                    <img
                      src={getPosterUrl(tv.poster_path)}
                      alt={tv.name}
                      className="w-full h-full object-cover object-center rounded-md"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="m-2">
                    <p className="text-gray-100 title-font text-xl font-medium">
                      {tv.name}
                    </p>
                  </h3>
                </Link>
              </article>
              <span className="hover:text-gray-800 dark:text-gray-400 text-gray-500 m-2">
                {formatDate(tv.first_air_date)}
              </span>
            </div>
          ))
        )}
      </div>

      {tvShows && page < tvShows.total_pages && (
        <div className="flex flex-col md:flex-row items-center justify-center px-6 py-4 space-y-2 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="bg-slate-500 w-56 border-0 py-2 px-6 focus:outline-none hover:bg-slate-600 rounded text-lg text-zinc-300 disabled:opacity-50"
          >
            {isFetching ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
          </button>
        </div>
      )}
    </div>
  );
}

export default AiringToday;
