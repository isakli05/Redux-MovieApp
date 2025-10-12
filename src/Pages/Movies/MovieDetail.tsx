import { Link, useParams } from 'react-router-dom';
import { useGetMovieDetailsQuery } from '../../api/endpoints/movies.endpoints';
import { extractIdFromSlug, getPosterUrl, getBackdropUrl, getYear, formatCurrency } from '../../utils';
import MovieColletionBackDrop from '../../components/Movies/MovieColletionBackDrop';
import MovieCredit from '../../components/Movies/MovieCredit';
import MovieLabel from '../../components/Movies/MovieLabel';
import MovieRecommendation from '../../components/Movies/MovieRecommendation';
import Loading from '../../components/Loading';

function MovieDetail() {
  const { id } = useParams();
  const movieId = extractIdFromSlug(id);

  const { data: movieDetail, isLoading, error } = useGetMovieDetailsQuery(movieId!, {
    skip: !movieId,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-red-400 text-xl">Film detayı yüklenirken bir hata oluştu.</p>
      </div>
    );
  }

  if (isLoading || !movieDetail) {
    return <Loading />;
  }

  return (
    <>
      <div className="flex px-4 py-8 md:py-6 flex-col md:flex-row text-slate-900 dark:text-slate-100 items-center bg-slate-900 relative">
        {/* Poster - Desktop */}
        <img
          loading="lazy"
          src={getPosterUrl(movieDetail.poster_path)}
          alt={movieDetail.title}
          className="hidden md:block w-40 h-60 left-2 top-36 md:left-3 lg:w-60 lg:h-96 opacity-100 z-10 absolute mx-4 object-cover object-center rounded-md shadow-2xl"
        />

        {/* Backdrop */}
        <figure className="w-full opacity-30">
          <img
            loading="lazy"
            src={getBackdropUrl(movieDetail.backdrop_path)}
            className="w-full h-[460px] object-top object-cover rounded-lg"
            alt={`${movieDetail.title} backdrop`}
          />
        </figure>

        {/* Film Bilgileri */}
        <div className="lg:w-max p-4 space-y-4 absolute left-4 w-4/5 lg:left-72">
          <h1 className="text-2xl text-zinc-100 font-semibold leading-tight">
            {movieDetail.title}
            <span className="text-3xl font-light">
              {' '}
              ({getYear(movieDetail.release_date)})
            </span>
          </h1>
          <p className="hidden md:block w-[700px] text-slate-300">
            {movieDetail.overview || 'Açıklama bulunmuyor.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {movieDetail.genres.map((genre) => (
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
          {/* Ana İçerik */}
          <article className="w-12/12 lg:w-9/12 dark:border-gray-700">
            <MovieCredit id={id} />
            
            <Link to={`/movie/${movieId}/cast`}>
              <li className="flex flex-col font-semibold text-xl text-left my-6 hover:text-slate-400 text-slate-300 duration-200 list-none">
                Tüm Oyuncular ve Ekip
              </li>
            </Link>

            {/* Koleksiyon */}
            {movieDetail.belongs_to_collection && (
              <>
                <hr className="border-slate-700 my-6" />
                <MovieColletionBackDrop
                  title={movieDetail.original_title}
                  id={movieDetail.belongs_to_collection.id}
                />
              </>
            )}

            {/* Öneriler */}
            <MovieRecommendation id={id} />
          </article>

          {/* Yan Panel - Film Detayları */}
          <aside className="bg-slate-900 text-zinc-300 lg:w-3/12 grid grid-cols-1 gap-4">
            {/* Orijinal Başlık */}
            <article className="w-full mt-4 pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Orijinal Başlık</h3>
              <p className="text-slate-400 font-light text-sm">
                {movieDetail.original_title}
              </p>
            </article>

            {/* Durum */}
            <article className="w-full pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Durum</h3>
              <p className="text-slate-400 font-light text-sm">
                {movieDetail.status === 'Released' ? 'Vizyonda' : 'Vizyonda Değil'}
              </p>
            </article>

            {/* Orijinal Dili */}
            <article className="w-full pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Orijinal Dili</h3>
              <p className="text-slate-400 font-light text-sm">
                {movieDetail.original_language.toUpperCase()}
              </p>
            </article>

            {/* Bütçe */}
            <article className="w-full pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Bütçe</h3>
              <p className="text-slate-400 font-light text-sm">
                {formatCurrency(movieDetail.budget)}
              </p>
            </article>

            {/* Kazanç */}
            <article className="w-full pb-4 border-b border-slate-700">
              <h3 className="text-slate-300 font-bold mb-2">Kazanç</h3>
              <p className="text-slate-400 font-light text-sm">
                {formatCurrency(movieDetail.revenue)}
              </p>
            </article>

            {/* Keywords */}
            <article className="w-full mt-4">
              <MovieLabel />
            </article>
          </aside>
        </div>
      </div>
    </>
  );
}

export default MovieDetail;
