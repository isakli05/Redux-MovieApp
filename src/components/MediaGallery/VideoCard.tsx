/**
 * VideoCard Component
 * Displays a video thumbnail with metadata
 */

import { memo } from 'react';
import { PlayIcon } from '@heroicons/react/24/solid';
import type { Video } from '../../types/videos';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  featured?: boolean;
}

const getVideoTypeLabel = (type: string): string => {
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

const VideoCard = memo<VideoCardProps>(({ video, onClick, featured = false }) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.key}/${featured ? 'maxresdefault' : 'mqdefault'}.jpg`;

  return (
    <button
      onClick={onClick}
      className={`group relative ${featured ? 'aspect-video' : 'aspect-video'} rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
      aria-label={`Play ${video.name}`}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={video.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent group-hover:from-slate-900/95 transition-colors duration-300" />
      
      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${featured ? 'w-20 h-20' : 'w-12 h-12'} rounded-full bg-cyan-500/90 backdrop-blur-lg flex items-center justify-center transform group-hover:scale-110 group-hover:bg-cyan-400 transition-all duration-300 shadow-2xl`}>
          <PlayIcon className={`${featured ? 'h-10 w-10' : 'h-6 w-6'} text-white ml-1`} />
        </div>
      </div>

      {/* Video Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-cyan-500/20 backdrop-blur-lg border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-semibold">
            {getVideoTypeLabel(video.type)}
          </span>
          {video.official && (
            <span className="px-3 py-1 bg-green-500/20 backdrop-blur-lg border border-green-500/30 rounded-full text-green-400 text-xs font-semibold">
              Resmi
            </span>
          )}
        </div>
        <h3 className={`text-white font-semibold ${featured ? 'text-lg' : 'text-sm'} line-clamp-2`}>
          {video.name}
        </h3>
      </div>
    </button>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;
