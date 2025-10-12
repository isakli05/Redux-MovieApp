import { useState } from 'react';
import { XMarkIcon, PlayIcon, FilmIcon } from '@heroicons/react/24/outline';
import { useGetTVShowVideosQuery } from '../../api/endpoints/tv.endpoints';
import { extractIdFromSlug } from '../../utils';
import type { Video } from '../../types/videos';

interface TvTrailerProps {
  id?: string;
}

function TvTrailer({ id }: TvTrailerProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const tvId = extractIdFromSlug(id);

  const { data: videosData, isLoading } = useGetTVShowVideosQuery(tvId!, {
    skip: !tvId,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
        <div className="h-64 bg-slate-700 rounded-xl"></div>
      </div>
    );
  }

  if (!videosData || videosData.results.length === 0) {
    return null;
  }

  // Video öncelik sırası: Trailer > Teaser > Clip > diğerleri
  const priorityOrder = ['Trailer', 'Teaser', 'Clip', 'Behind the Scenes', 'Featurette'];
  
  const sortedVideos = [...videosData.results]
    .filter(video => video.site === 'YouTube')
    .sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.type);
      const bIndex = priorityOrder.indexOf(b.type);
      const aOrder = aIndex === -1 ? priorityOrder.length : aIndex;
      const bOrder = bIndex === -1 ? priorityOrder.length : bIndex;
      return aOrder - bOrder;
    });

  const mainTrailer = sortedVideos[0];

  const getVideoTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'Trailer': 'Fragman',
      'Teaser': 'Tanıtım',
      'Clip': 'Klip',
      'Behind the Scenes': 'Kamera Arkası',
      'Featurette': 'Özel İçerik',
      'Bloopers': 'Hata Payı'
    };
    return labels[type] || type;
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full" />
        Videolar & Fragmanlar
      </h2>

      {/* Ana Fragman */}
      <div className="relative group">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50">
          <img
            src={`https://img.youtube.com/vi/${mainTrailer.key}/maxresdefault.jpg`}
            alt={mainTrailer.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent group-hover:from-slate-900/90 transition-colors duration-300" />
          
          {/* Play Button */}
          <button
            onClick={() => setSelectedVideo(mainTrailer)}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label="Fragmanı Oynat"
          >
            <div className="w-20 h-20 rounded-full bg-blue-500/90 backdrop-blur-lg flex items-center justify-center transform group-hover:scale-110 group-hover:bg-blue-400 transition-all duration-300 shadow-2xl">
              <PlayIcon className="h-10 w-10 text-white ml-1" />
            </div>
          </button>

          {/* Video Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold">
                {getVideoTypeLabel(mainTrailer.type)}
              </span>
              {mainTrailer.official && (
                <span className="px-3 py-1 bg-green-500/20 backdrop-blur-lg border border-green-500/30 rounded-full text-green-400 text-xs font-semibold">
                  Resmi
                </span>
              )}
            </div>
            <h3 className="text-white font-semibold text-lg line-clamp-2">
              {mainTrailer.name}
            </h3>
          </div>
        </div>
      </div>

      {/* Diğer Videolar */}
      {sortedVideos.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FilmIcon className="h-5 w-5 text-blue-400" />
            Diğer Videolar ({sortedVideos.length - 1})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedVideos.slice(1, 5).map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="group relative aspect-video rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300"
              >
                <img
                  src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                  alt={video.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                    <PlayIcon className="h-6 w-6 text-slate-900 ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="inline-block px-2 py-1 bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 rounded text-blue-400 text-xs font-semibold mb-1">
                    {getVideoTypeLabel(video.type)}
                  </span>
                  <p className="text-white text-sm font-medium line-clamp-1">
                    {video.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 text-white hover:bg-slate-700/50 transition-colors z-10"
              aria-label="Kapat"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Video Container */}
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.key}?autoplay=1&rel=0`}
                title={selectedVideo.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Video Info */}
            <div className="mt-4 p-4 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold">
                  {getVideoTypeLabel(selectedVideo.type)}
                </span>
                {selectedVideo.official && (
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold">
                    Resmi
                  </span>
                )}
              </div>
              <h3 className="text-white font-semibold text-lg">
                {selectedVideo.name}
              </h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default TvTrailer;

