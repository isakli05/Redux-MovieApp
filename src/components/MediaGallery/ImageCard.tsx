/**
 * ImageCard Component
 * Displays a single image card with metadata and hover effects
 */

import { memo, useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { getImageUrl } from '../../utils/image.utils';
import type { TMDBImage, ImageCategory } from '../../types/media';

interface ImageCardProps {
  image: TMDBImage;
  onClick: () => void;
  category: ImageCategory;
}

const ImageCard = memo<ImageCardProps>(({ image, onClick, category }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const imageUrl = getImageUrl(image.file_path, 'w500');
  const aspectRatio = image.aspect_ratio || 1;

  if (hasError) {
    return (
      <div className="relative bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50 flex items-center justify-center min-h-[200px]">
        <p className="text-slate-500 text-sm">Image unavailable</p>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group relative bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
      aria-label={`View ${category} image`}
    >
      {/* Image */}
      <div 
        className="relative w-full bg-slate-900/50"
        style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent" />
          </div>
        )}
        <img
          src={imageUrl}
          alt={`${category} image`}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Metadata on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{image.width} × {image.height}</span>
              {image.vote_count > 0 && (
                <div className="flex items-center gap-1">
                  <StarIcon className="h-3 w-3 text-yellow-400" />
                  <span>{image.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>
            {image.iso_639_1 && (
              <div className="text-xs text-slate-400">
                Language: {image.iso_639_1.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
});

ImageCard.displayName = 'ImageCard';

export default ImageCard;
