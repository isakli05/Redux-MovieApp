import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetPopularPersonsQuery } from '../../api/endpoints/persons.endpoints';
import { getProfileUrl } from '../../utils';

function Persons() {
  const [page, setPage] = useState(1);
  const { data: persons, isLoading, isFetching } = useGetPopularPersonsQuery(page);

  const handleLoadMore = () => {
    if (persons && page < persons.total_pages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <aside className="px-10 py-2">
        <h2 className="text-2xl font-semibold text-zinc-300">Popüler Kişiler</h2>
      </aside>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4">
        {isLoading && page === 1 ? (
          Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="animate-pulse p-4 rounded">
              <div className="bg-slate-700 h-56 rounded-md mb-2" />
              <div className="bg-slate-700 h-6 rounded mb-2" />
              <div className="bg-slate-700 h-4 rounded w-3/4" />
            </div>
          ))
        ) : (
          persons?.results.map((person) => (
            <div
              key={person.id}
              className="cursor-pointer shadow dark:drop-shadow-2xl p-4 rounded hover:scale-105 transition-transform duration-200"
            >
              <article className="flex flex-col">
                <Link to={`/person/${person.id}`}>
                  <img
                    src={getProfileUrl(person.profile_path)}
                    alt={person.name}
                    className="w-full lg:h-56 object-cover object-center rounded-md"
                    loading="lazy"
                  />
                  <h3 className="mt-2">
                    <p className="text-gray-100 title-font text-xl font-medium">
                      {person.name}
                    </p>
                  </h3>
                </Link>
              </article>
              <div className="mt-2">
                <span className="font-extralight text-sm text-gray-400">
                  {person.known_for?.slice(0, 3).map((item: any) => (
                    <span className="block" key={item.id}>
                      {item.title || item.name}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {persons && page < persons.total_pages && (
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

export default Persons;
