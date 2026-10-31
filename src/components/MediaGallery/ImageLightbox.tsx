/**
 * ImageLightbox Component
 * Full-screen modal for viewing images with zoom and navigation
 */

import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSwipeable } from 'react-swipeable';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon
} from '@heroicons/react/24/outline';
import { getImageUrl } from '../../utils/image.utils';
import type { TMDBImage } from '../../types/media';

interface ImageLightboxProps {
  isOpen: boolean;
  currentImage: TMDBImage | null;
  currentIndex: number;
  totalImages: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

/** Dark glass chrome shared by every floating lightbox control (spec §3). */
const controlClasses =
  'glass-bar rounded-lg border border-line text-primary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed';

const ImageLightbox = memo<ImageLightboxProps>(({
  isOpen,
  currentImage,
  currentIndex,
  totalImages,
  onClose,
  onNext,
  onPrevious,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Touch gesture handlers for mobile - MUST be called before any early returns
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (totalImages > 1) onNext();
    },
    onSwipedRight: () => {
      if (totalImages > 1) onPrevious();
    },
    onSwipedDown: () => {
      onClose();
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setIsLoading(true);

      // Focus management - focus close button when lightbox opens
      const closeButton = document.querySelector('[aria-label="Kapat"]') as HTMLElement;
      if (closeButton) {
        closeButton.focus();
      }
    }
  }, [isOpen, currentIndex]);

  // Early return AFTER all hooks
  if (!isOpen || !currentImage) return null;

  const imageUrl = getImageUrl(currentImage.file_path, 'original');

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const lightboxContent = (
    <div
      {...swipeHandlers}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
    >
      <h2 id="lightbox-title" className="sr-only">
        Görsel Görüntüleyici — Görsel {currentIndex + 1} / {totalImages}
      </h2>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-primary">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {totalImages}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            className={`p-2 ${controlClasses}`}
            aria-label="Uzaklaştır"
            disabled={zoom <= 0.5}
          >
            <MagnifyingGlassMinusIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
            className={`px-3 py-2 min-w-[3rem] text-center text-sm font-medium ${controlClasses}`}
            aria-label="Yakınlaştırmayı sıfırla"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className={`p-2 ${controlClasses}`}
            aria-label="Yakınlaştır"
            disabled={zoom >= 3}
          >
            <MagnifyingGlassPlusIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className={`p-2 ${controlClasses}`}
            aria-label="Kapat"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      {totalImages > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPrevious(); }}
            className={`absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 ${controlClasses}`}
            aria-label="Önceki görsel"
          >
            <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className={`absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 ${controlClasses}`}
            aria-label="Sonraki görsel"
          >
            <ChevronRightIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Image Container */}
      <div
        className="absolute inset-0 flex items-center justify-center p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-w-full max-h-full overflow-auto">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={`Galeri görseli ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{ transform: `scale(${zoom})` }}
            onLoad={() => setIsLoading(false)}
            draggable={false}
          />
        </div>
      </div>

      {/* Footer - Image Metadata */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-6 text-sm text-secondary">
          <span>
            {currentImage.width} × {currentImage.height}
          </span>
          <span>
            En boy oranı: {currentImage.aspect_ratio.toFixed(2)}
          </span>
          {currentImage.iso_639_1 && (
            <span>
              Dil: {currentImage.iso_639_1.toUpperCase()}
            </span>
          )}
          {currentImage.vote_count > 0 && (
            <span>
              {currentImage.vote_average.toFixed(1)} ({currentImage.vote_count} oy)
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
});

ImageLightbox.displayName = 'ImageLightbox';

export default ImageLightbox;
