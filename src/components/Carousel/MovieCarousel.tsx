import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import { StarIcon, PlayIcon } from '@heroicons/react/24/solid';
import { getPosterUrl, createSlug, formatDate } from '../../utils';

// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

interface MovieCarouselProps {
  movies: Movie[];
  isLoading?: boolean;
  mediaType?: 'movie' | 'tv';
  color?: 'cyan' | 'orange' | 'green' | 'blue' | 'purple';
}

const colorThemes = {
  cyan: {
    gradient: 'from-cyan-500 to-blue-500',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/90',
  },
  orange: {
    gradient: 'from-orange-500 to-red-500',
    text: 'text-orange-400',
    bg: 'bg-orange-500/90',
  },
  green: {
    gradient: 'from-green-500 to-emerald-500',
    text: 'text-green-400',
    bg: 'bg-green-500/90',
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-500',
    text: 'text-blue-400',
    bg: 'bg-blue-500/90',
  },
  purple: {
    gradient: 'from-purple-500 to-pink-500',
    text: 'text-purple-400',
    bg: 'bg-purple-500/90',
  },
};

function MovieCarousel({ movies, isLoading = false, mediaType = 'movie', color = 'cyan' }: MovieCarouselProps) {
  const theme = colorThemes[color];

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex-shrink-0 w-64 animate-pulse">
            <div className="aspect-[2/3] bg-slate-700/50 rounded-xl mb-3 animate-shimmer" />
            <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-700/50 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Swiper
      modules={[Autoplay, Navigation, Pagination, EffectCoverflow]}
      spaceBetween={16}
      slidesPerView="auto"
      navigation={{
        nextEl: '.swiper-button-next-custom',
        prevEl: '.swiper-button-prev-custom',
      }}
      pagination={{
        clickable: true,
        dynamicBullets: true,
      }}
      autoplay={{
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }}
      loop={movies.length > 5}
      speed={800}
      className="movie-carousel"
      breakpoints={{
        320: { slidesPerView: 2, spaceBetween: 12 },
        640: { slidesPerView: 3, spaceBetween: 16 },
        768: { slidesPerView: 4, spaceBetween: 16 },
        1024: { slidesPerView: 5, spaceBetween: 20 },
        1280: { slidesPerView: 6, spaceBetween: 24 },
      }}
    >
      {movies.map((item) => {
        const title = item.title || item.name || '';
        const originalTitle = item.original_title || item.original_name || '';
        const releaseDate = item.release_date || item.first_air_date || '';

        return (
          <SwiperSlide key={item.id} className="!w-auto">
            <Link
              to={`/${mediaType}/${createSlug(item.id, originalTitle)}`}
              className="group block w-48"
            >
              <div className="relative">
                {/* Movie Card */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-xl">
                  {/* Rating Badge */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span className="text-white text-sm font-bold">
                      {item.vote_average.toFixed(1)}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`${theme.bg} backdrop-blur-sm p-4 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300`}>
                        <PlayIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Poster */}
                  <img
                    loading="lazy"
                    src={getPosterUrl(item.poster_path)}
                    alt={title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h3 className={`font-semibold text-white group-hover:${theme.text} transition-colors line-clamp-2 leading-tight`}>
                    {title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {formatDate(releaseDate, { year: 'numeric' })}
                  </p>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        );
      })}

      {/* Custom Navigation Buttons */}
      <div className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-900/80 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors shadow-xl">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      <div className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-900/80 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors shadow-xl">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Swiper>
  );
}

export default MovieCarousel;

