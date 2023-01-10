import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Movies } from "../../types/Movies";

function MovieKeyList() {
  const { key_id } = useParams();
  const location = useLocation();

  const [movieKeyList, setMovieKeyList] = useState<Movies>();
  const [status, setStatus] = useState(true);
  const label =
    location.pathname.split("/")[2].split("-")[1] +
    " " +
    [location.pathname.split("/")[2].split("-")[2]] +
    " " +
    [location.pathname.split("/")[2].split("-")[3]] +
    " " +
    [location.pathname.split("/")[2].split("-")[4]] +
    " " +
    [location.pathname.split("/")[2].split("-")[5]];

  useEffect(() => {
    axios(
      `https://api.themoviedb.org/3/keyword/${key_id}/movies?api_key=a005a803cdec9237f52c2801d1f28661&language=tr-TR&include_adult=false`
    )
      .then((res) => res.data)
      .then((data) => setMovieKeyList(data))
      .finally(() => setStatus(false));
  }, []);

  return (
    <div className="mb-5">
      <div className="w-full bg-cyan-900 p-5 mb-5 space-y-4">
        <h1 className="flex justify-between text-3xl mx-6 font-medium leading-tight">
          <span className="text-white">{label}</span>
          <span className="text-white">{movieKeyList?.total_results} film</span>
        </h1>
      </div>
      <div className="text-gray-600 body-font overflow-hidden">
        <div className="py-6 mx-10">
          <div className="">
            {movieKeyList?.results.map((movie) => (
              <div
                key={movie.id}
                className="py-3 flex flex-wrap md:flex-nowrap"
              >
                <div className="flex-shrink-0 flex flex-col ">
                  <Link to={`/movie/${movie.id}`}>
                    <img
                      loading="lazy"
                      className="h-36 rounded-md"
                      src={`https://image.tmdb.org/t/p/original/${movie?.poster_path}`}
                      alt={`${movie?.title}`}
                    />
                  </Link>
                </div>
                <div className="md:flex-grow ml-5">
                  <h2 className="text-2xl font-medium text-gray-900 title-font">
                    {movie.title}
                  </h2>
                  <span className="text-gray-500 text-sm">
                    {movie.release_date}
                  </span>

                  <p className="leading-relaxed mt-6">
                    {movie.overview !== ""
                      ? movie.overview.slice(0, 260).concat("...")
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieKeyList;