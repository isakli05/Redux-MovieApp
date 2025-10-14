import { Link, useParams } from 'react-router-dom';
import { 
  StarIcon, 
  CalendarIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  LanguageIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useGetMovieDetailsQuery } from '../../api/endpoints/movies.endpoints';
import { extractIdFromSlug, getPosterUrl, getBackdropUrl, getYear, formatCurrency, formatDate } from '../../utils';
import MovieColletionBackDrop from '../../components/Movies/MovieColletionBackDrop';
import MovieCredit from '../../components/Movies/MovieCredit';
import MovieLabel from '../../components/Movies/MovieLabel';
import MovieRecommendation from '../../components/Movies/MovieRecommendation';
import MediaGallery from '../../components/MediaGallery/MediaGallery';
import Loading from '../../components/Loading';

function MovieDetail() {
  const { id } = useParams();
  const movieId = extractIdFromSlug(id);

  const { data: movieDetail, isLoading, error } = useGetMovieDetailsQuery(movieId!, {
    skip: !movieId,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-xl font-semibold">Film detayı yüklenirken bir hata oluştu</p>
          <p className="text-slate-400">Lütfen daha sonra tekrar deneyin</p>
        </div>
      </div>
    );
  }

  if (isLoading || !movieDetail) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Backdrop Image with Gradient Overlay */}
        <div className="relative h-[600px] md:h-[700px]">
          {/* Backdrop */}
          <div className="absolute inset-0">
            <img
              loading="lazy"
              src={getBackdropUrl(movieDetail.backdrop_path)}
              className="w-full h-full object-cover object-center"
              alt={movieDetail.title}
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900/50" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8 h-full items-end md:items-center py-12">
              {/* Poster */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition duration-300" />
                  <img
                    loading="lazy"
                    src={getPosterUrl(movieDetail.poster_path)}
                    alt={movieDetail.title}
                    className="relative w-48 md:w-72 lg:w-80 rounded-xl shadow-2xl object-cover"
                  />
                </div>
              </div>

              {/* Movie Info */}
              <div className="flex-1 space-y-6 pb-8 md:pb-0">
                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                    {movieDetail.title}
                  </h1>
                  <p className="text-xl md:text-2xl text-slate-400 font-light">
                    {movieDetail.original_title} ({getYear(movieDetail.release_date)})
                  </p>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                  {/* Rating */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-500/30 rounded-full">
                    <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold">{movieDetail.vote_average.toFixed(1)}</span>
                    <span className="text-slate-400">/10</span>
                  </div>

                  {/* Release Date */}
                  {movieDetail.release_date && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-full text-slate-300">
                      <CalendarIcon className="h-5 w-5" />
                      {formatDate(movieDetail.release_date, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  )}

                  {/* Runtime */}
                  {movieDetail.runtime && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-full text-slate-300">
                      <ClockIcon className="h-5 w-5" />
                      {Math.floor(movieDetail.runtime / 60)}s {movieDetail.runtime % 60}dk
                    </div>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {movieDetail.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-4 py-2 bg-cyan-500/20 backdrop-blur-lg border border-cyan-500/30 rounded-full text-cyan-400 font-medium text-sm hover:bg-cyan-500/30 transition-colors"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Overview */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Hikaye</h3>
                  <p className="text-slate-300 leading-relaxed max-w-3xl">
                    {movieDetail.overview || 'Açıklama bulunmuyor.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Media Gallery */}
            <MediaGallery
              mediaType="movie"
              id={movieId!}
              defaultTab="videos"
            />

            {/* Cast */}
            <section>
              <MovieCredit id={id} />
              <Link 
                to={`/movie/${movieId}/cast`}
                className="group inline-flex items-center gap-2 mt-6 px-6 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all duration-300"
              >
                <UserGroupIcon className="h-5 w-5" />
                <span className="font-semibold">Tüm Oyuncular ve Ekip</span>
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </section>

            {/* Collection */}
            {movieDetail.belongs_to_collection && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                  Koleksiyon
                </h2>
                <MovieColletionBackDrop
                  title={movieDetail.original_title}
                  id={movieDetail.belongs_to_collection.id}
                />
              </section>
            )}

            {/* Recommendations */}
            <section>
              <MovieRecommendation id={id} />
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Info Card */}
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 shadow-xl space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                  Film Bilgileri
                </h3>

                {/* Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="font-semibold">Durum</span>
                  </div>
                  <p className="text-white pl-7">
                    {movieDetail.status === 'Released' ? 'Vizyonda' : 'Vizyonda Değil'}
                  </p>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <LanguageIcon className="h-5 w-5" />
                    <span className="font-semibold">Orijinal Dil</span>
                  </div>
                  <p className="text-white pl-7">
                    {movieDetail.original_language.toUpperCase()}
                  </p>
                </div>

                {/* Budget */}
                {movieDetail.budget > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <CurrencyDollarIcon className="h-5 w-5" />
                      <span className="font-semibold">Bütçe</span>
                    </div>
                    <p className="text-white pl-7 font-mono">
                      {formatCurrency(movieDetail.budget)}
                    </p>
                  </div>
                )}

                {/* Revenue */}
                {movieDetail.revenue > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                      <span className="font-semibold">Hasılat</span>
                    </div>
                    <p className="text-green-400 pl-7 font-mono font-semibold">
                      {formatCurrency(movieDetail.revenue)}
                    </p>
                  </div>
                )}
              </div>

              {/* Keywords */}
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                <MovieLabel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;
