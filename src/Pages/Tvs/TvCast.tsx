import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MovieCredits } from "../../types/movieCredits";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchTvCredits } from "../../redux/tvShows/tvCreditSlice";
import TvBanner from "../../components/Tvs/TvBanner";
import { image } from "../../helper";

function TvCast() {
  const { id } = useParams<{ id: string }>();
  const tvCredit = useAppSelector((state) => state.tvCredits.data);
  const status = useAppSelector((state) => state.tvCredits.loading);
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchTvCredits(id));
  }, []);

  console.log(tvCredit);
  
  
  return (
    <>
      {status==="pending" ? (
        <div className="flex  flex-col md:flex-row items-center justify-center px-6 py-4 space-y-2 text-center">
          <button
            type="button"
            className="bg-transparent w-56 border-0 py-2 px-6 focus:outline-none  rounded text-lg"
            disabled
          >
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
          </button>
        </div>
      ) : (
        <>
    <div className="dark:bg-slate-900">
      <TvBanner />
      <div className="flex">
        <div className="w-3/6">
          <h3 className="text-3xl text-left ml-16 text-zinc-300 font-semibold">
          Dizi Oyuncuları{" "}
            <span className="text-2xl font-thin">
              ({tvCredit?.cast.length})
            </span>
          </h3>
          <ul className="space-y-4 ml-16 mt-3">
            {tvCredit?.cast.map((cast) => (
              <li key={cast.id} className="flex items-center gap-3">
                <Link className="flex gap-3" to={`/person/${cast.id}`}>
                  <img
                    loading="lazy"
                    className="w-16"
                    src={`${
                      cast?.profile_path === null
                        ? "/public/assets/nullUser.svg"
                        : `${image}${cast?.profile_path}`
                    }`}
                    alt={cast.name}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-100">{cast.name}</h3>
                    <p>{cast.character}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-3/6">
          <h3 className="text-3xl text-left ml-16 text-zinc-300 font-semibold">
          Dizi Ekibi{" "}
            <span className="text-2xl font-thin">
              ({tvCredit?.crew.length})
            </span>
          </h3>
          <ul className="space-y-4 ml-16 mt-3">
            {tvCredit?.crew.map((crew) => (
              <li key={crew.id} className="flex items-center gap-3">
                <Link className="flex gap-3" to={`/person/${crew.id}`}>
                  <img
                    loading="lazy"
                    className="w-16"
                    src={`${
                      crew?.profile_path === null
                        ? "/public/assets/nullUser.svg"
                        : `${image}${crew?.profile_path}`
                    }`}
                    alt={crew.name}
                  />
                  
                  <div>
                    <h3 className="font-semibold text-gray-100">{crew.name}</h3>
                    <p className="text-zinc-300">{crew.known_for_department}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    </>
      )}
    </>
  );
}

export default TvCast;