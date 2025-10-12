import { Link, useParams } from 'react-router-dom';
import { useGetTVShowDetailsQuery } from '../../api/endpoints/tv.endpoints';
import { extractIdFromSlug, getPosterUrl, getBackdropUrl, getYear, formatDuration } from '../../utils';
import TvCredits from '../../components/Tvs/TvCredit';
import TvLabel from '../../components/Tvs/TvLabel';
import TvSeasonsBackdrops from '../../components/Tvs/TvSeasonsBackdrops';
import { languages } from '../../languages-list';
import Loading from '../../components/Loading';

function TvDetail() {
  const { id } = useParams();
  const tvId = extractIdFromSlug(id);

  const { data: tvDetail, isLoading, error } = useGetTVShowDetailsQuery(tvId!, {
    skip: !tvId,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-red-400 text-xl">TV şovu yüklenirken bir hata oluştu.</p>
      </div>
    );
  }

  if (isLoading || !tvDetail) {
    return <Loading />;
  }

  const languageName = languages.find(
    (lang) => lang.iso_639_1 === tvDetail.original_language
  )?.english_name || tvDetail.original_language.toUpperCase();

  return (
    <>
      <div className="flex px-4 py-8 md:py-6 flex-col md:flex-row text-slate-900 dark:text-slate-100 items-center bg-slate-900 relative">
        {/* Poster */}
        <img
          loading="lazy"
          src={getPosterUrl(tvDetail.poster_path)}
          alt={tvDetail.name}
          className="hidden md:block w-40 h-60 left-2 top-36 md:left-3 lg:w-60 lg:h-96 opacity-100 z-10 absolute mx-4 object-cover object-center rounded-md shadow-2xl"
        />

        {/* Backdrop */}
        <figure className="w-full opacity-30">
          <img
            loading="lazy"
            src={getBackdropUrl(tvDetail.backdrop_path)}
            className="w-full h-[460px] object-top object-cover rounded-lg"
            alt={tvDetail.name}
          />
        </figure>

        {/* TV Show Info */}
        <div className="lg:w-max p-4 space-y-4 absolute left-4 w-4/5 lg:left-72">
          <h1 className="text-2xl text-zinc-100 font-semibold leading-tight">
            {tvDetail.name}
            <span className="text-3xl font-light">
              {' '}
              ({getYear(tvDetail.first_air_date)})
            </span>
          </h1>
          <p className="hidden md:block w-[700px] text-slate-300">
            {tvDetail.overview || 'Açıklama bulunmuyor.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {tvDetail.genres.map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-200"
              >
                {genre.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 bg-slate-900 text-gray-900 dark:text-gray-100">
        <div className="lg:flex lg:gap-x-8">
          {/* Main Content */}
          <article className="w-12/12 lg:w-9/12 dark:border-gray-700">
            <TvCredits id={id} />
            
            <Link to={`/tv/${tvId}/cast`}>
              <li className="flex flex-col font-semibold text-xl text-left my-6 hover:text-slate-400 text-slate-300 duration-200 list-none">
                Tüm Oyuncular ve Ekip
              </li>
            </Link>

            <TvSeasonsBackdrops />
          </article>

          {/* Sidebar */}
          <aside className="bg-slate-900 text-zinc-300 lg:w-3/12 grid grid-cols-1 gap-4">
            <article className="w-full mt-4 pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Orijinal Başlık</h3>
              <p className="text-slate-400 font-light text-sm">
                {tvDetail.original_name}
              </p>
            </article>

            <article className="w-full pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Durum</h3>
              <p className="text-slate-400 font-light text-sm">
                {tvDetail.status}
              </p>
            </article>

            <article className="w-full pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Ağ</h3>
              <div className="flex flex-wrap gap-2">
                {tvDetail.networks.map((network) => (
                  <Link
                    key={network.id}
                    to={`/network/${network.id}-${network.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-slate-400 hover:text-slate-200 font-light text-sm"
                  >
                    {network.name}
                  </Link>
                ))}
              </div>
            </article>

            <article className="w-full pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Orijinal Dili</h3>
              <p className="text-slate-400 font-light text-sm">
                {languageName}
              </p>
            </article>

            <article className="w-full pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Sezon Sayısı</h3>
              <p className="text-slate-400 font-light text-sm">
                {tvDetail.number_of_seasons}
              </p>
            </article>

            <article className="w-full pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Bölüm Sayısı</h3>
              <p className="text-slate-400 font-light text-sm">
                {tvDetail.number_of_episodes}
              </p>
            </article>

            <article className="w-full mt-4">
              <TvLabel />
            </article>
          </aside>
        </div>
      </div>
    </>
  );
}

export default TvDetail;
