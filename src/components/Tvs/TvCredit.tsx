import { useEffect } from "react";
import { Link } from "react-router-dom";
import { image } from "../../helper";

import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchTvCredits } from "../../redux/tvShows/tvCreditSlice";

type TvCreditsProps = {
  id?: string;
};

function TvCredit({ id }: TvCreditsProps) {
  const dispatch = useAppDispatch();
  const tvCredits = useAppSelector((state) => state.tvCredits.data);
  

  useEffect(() => {
    dispatch(fetchTvCredits(id!));
  }, []);

  
  return (
    <div className="bg-white py-2 dark:bg-slate-900 dark:text-slate-100 text-slate-900">
      <h3 className="text-3xl text-left text-zinc-600 font-semibold">
        Dizi Oyuncuları
      </h3>
      <ul className="flex mt-3  overflow-scroll overflow-y-hidden">
        {tvCredits?.cast
          .map((cast) => (
            <Link key={cast.id} to={`/person/${cast.id}`}>
              <li className="flex flex-col shadow rounded-lg mb-3">
                <figure className="flex-col space-y-2">
                  <img
                    loading="lazy"
                    className="h-44  rounded-md"
                    src={`${
                      cast?.profile_path === null
                        ? "/public/assets/nullUser.svg"
                        : `${image}${cast?.profile_path}`
                    }`}
                    alt={`${cast?.name}`}
                  />
                  <div className="flex flex-col  w-36 space-y-1">
                    <p className="font-semibold w-32 dark:text-slate-100 text-slate-900">
                      {cast.original_name}
                    </p>
                    <span className="text-sm font-light dark:text-slate-400 text-slate-500">
                      //TODO:dizideki isimleri yazılacak                      
                      {cast.character}
                    </span>
                    <span className="text-sm font-light dark:text-slate-400 text-slate-500">
                      //TODO:oyuncuların oynadığı bölüm sayısı
                      
                    </span>
                  </div>
                </figure>
              </li>
            </Link>
          ))
          .slice(0, 9)}
        <Link to={`/tv/${id}/cast`}>
          <li className="flex flex-col text-center h-44 items-center justify-center hover:text-slate-400 duration-200 ">
            Tümünü Gör<i className="fa-solid fa-arrow-right"></i>
          </li>
        </Link>
      </ul>
    </div>
  );
}
export default TvCredit;