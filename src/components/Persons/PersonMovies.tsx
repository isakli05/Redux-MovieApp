import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilmIcon, StarIcon, CalendarIcon, TvIcon } from '@heroicons/react/24/outline';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode } from 'swiper/modules';
import type { MovieCredit, TvCredit } from '../../types/personDetail';
import { getPosterUrl, getYear, createSlug } from '../../utils';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

interface PersonMoviesProps {
  movieCredits?: MovieCredit[];
  tvCredits?: TvCredit[];
  personName: string;
  isMale: boolean;
}

type MediaType = 'movies' | 'tv';

function PersonMovies({ movieCredits = [], tvCredits = [], personName, isMale }: PersonMoviesProps) {
  const [activeTab, setActiveTab] = useState<MediaType>('movies');

  // Filmleri tarihe göre sırala (en yeni önce)
  const sortedMovies = [...movieCredits]
    .filter(movie => movie.poster_path) // Sadece posteri olanlar
    .sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateB - dateA;
    });

  // Dizileri tarihe göre sırala (en yeni önce)
  const sortedTvShows = [...tvCredits]
    .filter(tv => tv.poster_path) // Sadece posteri olanlar
    .sort((a, b) => {
      const dateA = a.first_air_date ? new Date(a.first_air_date).getTime() : 0;
      const dateB = b.first_air_date ? new Date(b.first_air_date).getTime() : 0;
      return dateB - dateA;
    });

  const hasMovies = sortedMovies.length > 0;
  const hasTvShows = sortedTvShows.length > 0;

  if (!hasMovies && !hasTvShows) {
    return null;
  }

  const colorTheme = {
    gradient: isMale ? 'from-blue-400 to-cyan-500' : 'from-purple-400 to-pink-500',
    activeTab: isMale ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-purple-500 to-pink-500',
    inactiveTab: 'bg-slate-700/50',
    hoverBorder: isMale ? 'hover:border-cyan-500/50' : 'hover:border-pink-500/50',
    iconColor: isMale ? 'text-cyan-400' : 'text-pink-400',
  };

  return (
    <section className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <div className={`w-1 h-8 bg-gradient-to-b ${colorTheme.gradient} rounded-full`} />
          Filmografi
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-1">
          {hasMovies && (
            <button
              onClick={() => setActiveTab('movies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'movies'
                  ? `${colorTheme.activeTab} text-white shadow-lg`
                  : `${colorTheme.inactiveTab} text-slate-400 hover:text-white`
              }`}
            >
              <FilmIcon className="h-5 w-5" />
              <span>Filmler</span>
              <span className="text-xs opacity-75">({sortedMovies.length})</span>
            </button>
          )}
          {hasTvShows && (
            <button
              onClick={() => setActiveTab('tv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'tv'
                  ? `${colorTheme.activeTab} text-white shadow-lg`
                  : `${colorTheme.inactiveTab} text-slate-400 hover:text-white`
              }`}
            >
              <TvIcon className="h-5 w-5" />
              <span>Diziler</span>
              <span className="text-xs opacity-75">({sortedTvShows.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Movies Carousel */}
      {activeTab === 'movies' && hasMovies && (
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, FreeMode]}
            spaceBetween={16}
            slidesPerView={2}
            freeMode={true}
            navigation
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
              1280: { slidesPerView: 6 },
            }}
            className="person-movies-swiper"
          >
            {sortedMovies.map((movie) => (
              <SwiperSlide key={movie.credit_id}>
                <Link
                  to={`/movie/${createSlug(movie.id, movie.title)}`}
                  className="group block"
                >
                  <div className={`relative rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50 ${colorTheme.hoverBorder} transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl`}>
                    {/* Poster */}
                    <div className="relative aspect-[2/3]">
                      <img
                        src={getPosterUrl(movie.poster_path)}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Info Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center gap-2 mb-1">
                          {movie.vote_average > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                              <StarIcon className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs font-semibold text-white">
                                {movie.vote_average.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {movie.release_date && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                              <CalendarIcon className="h-3 w-3 text-slate-300" />
                              <span className="text-xs font-semibold text-white">
                                {getYear(movie.release_date)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="p-3 space-y-1">
                      <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-cyan-400 group-hover:to-blue-400 transition-all">
                        {movie.title}
                      </h3>
                      {movie.character && (
                        <p className="text-slate-400 text-xs line-clamp-1">
                          {movie.character} rolünde
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* TV Shows Carousel */}
      {activeTab === 'tv' && hasTvShows && (
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, FreeMode]}
            spaceBetween={16}
            slidesPerView={2}
            freeMode={true}
            navigation
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
              1280: { slidesPerView: 6 },
            }}
            className="person-movies-swiper"
          >
            {sortedTvShows.map((tv) => (
              <SwiperSlide key={tv.credit_id}>
                <Link
                  to={`/tv/${createSlug(tv.id, tv.name)}`}
                  className="group block"
                >
                  <div className={`relative rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50 ${colorTheme.hoverBorder} transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl`}>
                    {/* Poster */}
                    <div className="relative aspect-[2/3]">
                      <img
                        src={getPosterUrl(tv.poster_path)}
                        alt={tv.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Info Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center gap-2 mb-1">
                          {tv.vote_average > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                              <StarIcon className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs font-semibold text-white">
                                {tv.vote_average.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {tv.first_air_date && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                              <CalendarIcon className="h-3 w-3 text-slate-300" />
                              <span className="text-xs font-semibold text-white">
                                {getYear(tv.first_air_date)}
                              </span>
                            </div>
                          )}
                        </div>
                        {tv.episode_count && tv.episode_count > 1 && (
                          <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full inline-block">
                            <span className="text-xs font-semibold text-white">
                              {tv.episode_count} Bölüm
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TV Show Info */}
                    <div className="p-3 space-y-1">
                      <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-400 group-hover:to-purple-400 transition-all">
                        {tv.name}
                      </h3>
                      {tv.character && (
                        <p className="text-slate-400 text-xs line-clamp-1">
                          {tv.character} rolünde
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </section>
  );
}

export default PersonMovies;

