import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchPersons } from "../../redux/persons/personSlice";
import { Link } from "react-router-dom";
import { image } from "../../helper";

function Persons() {
  const persons = useAppSelector((state) => state.persons);
  const status = useAppSelector((state) => state.persons.loading);
  const nextPage = useAppSelector((state) => state.persons.page);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchPersons());
    }
  }, []);
  

  return (
    <>
    <aside className="px-10 py-2">
      <h2 className="text-2xl font-semibold text-zinc-300">Popüler Kişiler</h2>
    </aside>
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {persons.data?.results.map((person) => (
        <div
          key={person.id}
          className="cursor-pointer shadow dark:drop-shadow-2xl p-4 rounded"
        >
          <article className="flex flex-col">
            <Link to={`/person/${person.id}`}>
              <img
                src={`${person?.profile_path===null?'/public/assets/nullUser.svg':`${image}${person?.profile_path}`}`}
                alt={person.name}
                className="w-full lg:h-56 object-cover object-center rounded-md"
                loading="lazy"
              />
              <h3 className="mt-2">
                <p className="text-gray-100 dark:text-black-100 title-font text-xl font-medium">
                  {person.name}
                </p>
              </h3>
            </Link>          
          </article>
          <span className="font-extralight text-sm cursor-text text-gray-200">
              {person.known_for.map((movie) => 
              <span className="ml-1" key={movie.id}>{movie.title===null?movie.original_title:movie.title}<br/></span>
              )}
            </span>
        </div>
      ))}
    </div>
    <div className="flex  flex-col md:flex-row items-center justify-center px-6 py-4 space-y-2 text-center">
      <button
        type="button"
        onClick={() => dispatch(fetchPersons(nextPage))}
        disabled={status === "pending"}
        className="bg-slate-500 w-56 border-0 py-2 px-6 focus:outline-none hover:bg-slate-600 rounded text-lg text-zinc-300"
      >
        {status === "fulfilled" ? (
          "Daha Fazla Yükle"
        ) : (
          <div role="status">
            <svg
              aria-hidden="true"
              className="m-auto w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        )}
      </button>
    </div>
  </>
  )
}

export default Persons