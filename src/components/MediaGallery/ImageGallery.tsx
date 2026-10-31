/**
 * ImageGallery Component
 * Displays a grid of images with filtering, sorting, and lightbox
 */

import { memo, useState, useMemo } from 'react';
import { useImageLightbox } from '../../hooks/useImageLightbox';
import ImageCard from './ImageCard';
import ImageLightbox from './ImageLightbox';
import ImageGalleryToolbar from './ImageGalleryToolbar';
import type { TMDBImage, ImageCategory, SortOption, FilterLanguage, ViewMode } from '../../types/media';

interface ImageGalleryProps {
  images: TMDBImage[];
  category: ImageCategory;
}

const ImageGallery = memo<ImageGalleryProps>(({ images, category }) => {
  const [sortBy, setSortBy] = useState<SortOption>('vote_average');
  const [filterLanguage, setFilterLanguage] = useState<FilterLanguage>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter and sort images
  const processedImages = useMemo(() => {
    let filtered = [...images];

    // Apply language filter
    if (filterLanguage !== 'all') {
      filtered = filtered.filter(img => {
        if (filterLanguage === 'null') return img.iso_639_1 === null;
        return img.iso_639_1 === filterLanguage;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'vote_average':
          return b.vote_average - a.vote_average;
        case 'vote_count':
          return b.vote_count - a.vote_count;
        case 'width':
          return b.width - a.width;
        case 'height':
          return b.height - a.height;
        default:
          return 0;
      }
    });

    return filtered;
  }, [images, sortBy, filterLanguage]);

  const lightbox = useImageLightbox(processedImages);

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary">Bu kategori için görsel bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ImageGalleryToolbar
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterLanguage={filterLanguage}
        onFilterChange={setFilterLanguage}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={processedImages.length}
      />

      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' 
          : 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4'
        }
      `}>
        {processedImages.map((image, index) => (
          <ImageCard
            key={`${image.file_path}-${index}`}
            image={image}
            onClick={() => lightbox.open(index)}
            category={category}
          />
        ))}
      </div>

      <ImageLightbox
        isOpen={lightbox.isOpen}
        currentImage={lightbox.currentImage}
        currentIndex={lightbox.currentIndex}
        totalImages={processedImages.length}
        onClose={lightbox.close}
        onNext={lightbox.next}
        onPrevious={lightbox.previous}
      />
    </div>
  );
});

ImageGallery.displayName = 'ImageGallery';

export default ImageGallery;
