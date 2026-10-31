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
      className={`group relative ${featured ? 'aspect-video' : 'aspect-video'} overflow-hidden rounded-lg border border-line bg-surface-raised transition-all duration-300 ease-cine hover:scale-102 hover:border-accent`}
      aria-label={`${video.name} oynat`}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={video.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Overlay */}
      <div className="scrim-bottom absolute inset-0" />

      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${featured ? 'w-20 h-20' : 'w-12 h-12'} flex items-center justify-center rounded-full bg-accent transition-all duration-300 ease-cine group-hover:scale-110 group-hover:bg-accent-hover`}>
          <PlayIcon className={`${featured ? 'h-10 w-10' : 'h-6 w-6'} ml-1 text-accent-ink`} />
        </div>
      </div>

      {/* Video Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="glass-bar rounded-full border border-line px-3 py-1 text-xs font-semibold text-accent">
            {getVideoTypeLabel(video.type)}
          </span>
          {video.official && (
            <span className="glass-bar rounded-full border border-line px-3 py-1 text-xs font-semibold text-success-text">
              Resmi
            </span>
          )}
        </div>
        <h3 className={`font-semibold text-primary ${featured ? 'text-lg' : 'text-sm'} line-clamp-2`}>
          {video.name}
        </h3>
      </div>
    </button>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;
