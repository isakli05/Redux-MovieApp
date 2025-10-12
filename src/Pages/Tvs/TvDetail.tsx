import { Link, useParams } from 'react-router-dom';
import { 
  StarIcon, 
  CalendarIcon, 
  TvIcon,
  LanguageIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ArrowRightIcon,
  SignalIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { useGetTVShowDetailsQuery } from '../../api/endpoints/tv.endpoints';
import { extractIdFromSlug, getPosterUrl, getBackdropUrl, getYear, formatDate } from '../../utils';
import TvCredits from '../../components/Tvs/TvCredit';
import TvLabel from '../../components/Tvs/TvLabel';
import TvSeasonsBackdrops from '../../components/Tvs/TvSeasonsBackdrops';
import TvTrailer from '../../components/Tvs/TvTrailer';
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-xl font-semibold">TV şovu yüklenirken bir hata oluştu</p>
          <p className="text-slate-400">Lütfen daha sonra tekrar deneyin</p>
        </div>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Backdrop Image with Gradient Overlay */}
        <div className="relative h-[600px] md:h-[700px]">
          {/* Backdrop */}
          <div className="absolute inset-0">
            <img
              loading="lazy"
              src={getBackdropUrl(tvDetail.backdrop_path)}
              className="w-full h-full object-cover object-center"
              alt={tvDetail.name}
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
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition duration-300" />
                  <img
                    loading="lazy"
                    src={getPosterUrl(tvDetail.poster_path)}
                    alt={tvDetail.name}
                    className="relative w-48 md:w-72 lg:w-80 rounded-xl shadow-2xl object-cover"
                  />
                </div>
              </div>

              {/* TV Show Info */}
              <div className="flex-1 space-y-6 pb-8 md:pb-0">
                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                    {tvDetail.name}
                  </h1>
                  <p className="text-xl md:text-2xl text-slate-400 font-light">
                    {tvDetail.original_name} ({getYear(tvDetail.first_air_date)})
                  </p>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                  {/* Rating */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-500/30 rounded-full">
                    <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold">{tvDetail.vote_average.toFixed(1)}</span>
                    <span className="text-slate-400">/10</span>
                  </div>

                  {/* First Air Date */}
                  {tvDetail.first_air_date && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-full text-slate-300">
                      <CalendarIcon className="h-5 w-5" />
                      {formatDate(tvDetail.first_air_date, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-full text-slate-300">
                    <SignalIcon className="h-5 w-5" />
                    {tvDetail.status}
                  </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {tvDetail.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-4 py-2 bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 rounded-full text-blue-400 font-medium text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Overview */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Hikaye</h3>
                  <p className="text-slate-300 leading-relaxed max-w-3xl">
                    {tvDetail.overview || 'Açıklama bulunmuyor.'}
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
            {/* Trailer */}
            <TvTrailer id={id} />

            {/* Cast */}
            <section>
              <TvCredits id={id} />
              <Link 
                to={`/tv/${tvId}/cast`}
                className="group inline-flex items-center gap-2 mt-6 px-6 py-3 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-300 hover:text-blue-400 hover:border-blue-500/50 transition-all duration-300"
              >
                <UserGroupIcon className="h-5 w-5" />
                <span className="font-semibold">Tüm Oyuncular ve Ekip</span>
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </section>

            {/* Seasons */}
            <section>
              <TvSeasonsBackdrops />
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Info Card */}
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 shadow-xl space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full" />
                  Dizi Bilgileri
                </h3>

                {/* Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="font-semibold">Durum</span>
                  </div>
                  <p className="text-white pl-7">
                    {tvDetail.status}
                  </p>
                </div>

                {/* Network */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <TvIcon className="h-5 w-5" />
                    <span className="font-semibold">Ağ</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-7">
                    {tvDetail.networks.map((network) => (
                      <Link
                        key={network.id}
                        to={`/network/${network.id}-${network.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                      >
                        {network.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <LanguageIcon className="h-5 w-5" />
                    <span className="font-semibold">Orijinal Dil</span>
                  </div>
                  <p className="text-white pl-7">
                    {languageName}
                  </p>
                </div>

                {/* Seasons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ListBulletIcon className="h-5 w-5" />
                    <span className="font-semibold">Sezon Sayısı</span>
                  </div>
                  <p className="text-white pl-7 font-semibold">
                    {tvDetail.number_of_seasons} Sezon
                  </p>
                </div>

                {/* Episodes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ListBulletIcon className="h-5 w-5" />
                    <span className="font-semibold">Bölüm Sayısı</span>
                  </div>
                  <p className="text-white pl-7 font-semibold">
                    {tvDetail.number_of_episodes} Bölüm
                  </p>
                </div>
              </div>

              {/* Keywords */}
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                <TvLabel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TvDetail;
