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

/** Singular Turkish labels used for accessible names and alt text. */
const CATEGORY_LABELS: Record<ImageCategory, string> = {
  posters: 'Poster',
  backdrops: 'Arka plan',
  logos: 'Logo',
  profiles: 'Profil fotoğrafı',
};

const ImageCard = memo<ImageCardProps>(({ image, onClick, category }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const imageUrl = getImageUrl(image.file_path, 'w500');
  const aspectRatio = image.aspect_ratio || 1;
  const categoryLabel = CATEGORY_LABELS[category];

  if (hasError) {
    return (
      <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-raised">
        <p className="text-sm text-muted">Görsel yüklenemedi</p>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg border border-line bg-surface-raised transition-all duration-300 ease-cine hover:scale-102 hover:border-accent"
      aria-label={`${categoryLabel} görseli`}
    >
      {/* Image */}
      <div
        className="relative w-full bg-surface-void"
        style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent" />
          </div>
        )}
        <img
          src={imageUrl}
          alt={`${categoryLabel} görseli`}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />

        {/* Overlay on hover */}
        <div className="scrim-bottom absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Metadata on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>{image.width} × {image.height}</span>
              {image.vote_count > 0 && (
                <div className="flex items-center gap-1">
                  <StarIcon className="h-3 w-3 text-accent" />
                  <span>{image.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>
            {image.iso_639_1 && (
              <div className="text-xs text-muted">
                Dil: {image.iso_639_1.toUpperCase()}
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
