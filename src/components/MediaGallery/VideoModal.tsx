/**
 * VideoModal Component
 * Full-screen modal for playing YouTube videos
 */

import { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Video } from '../../types/videos';

interface VideoModalProps {
  isOpen: boolean;
  video: Video | null;
  onClose: () => void;
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

const VideoModal = memo<VideoModalProps>(({ isOpen, video, onClose }) => {
  // Handle Escape key and focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus management - focus close button when modal opens
    const closeButton = document.querySelector('[aria-label="Kapat"]') as HTMLElement;
    if (closeButton) {
      closeButton.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !video) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      <div
        className="relative w-full max-w-6xl shadow-cine"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="glass-bar absolute -top-12 right-0 z-10 rounded-full border border-line p-2 text-primary transition-colors duration-150 ease-cine hover:border-accent hover:text-accent"
          aria-label="Kapat"
        >
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Video Container */}
        <div className="relative aspect-video overflow-hidden rounded-xl border border-line shadow-cine">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&rel=0`}
            title={video.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Video Info */}
        <div className="mt-4 rounded-xl border border-line bg-surface-raised p-4">
          <h2 id="video-modal-title" className="sr-only">{video.name}</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className="glass-bar rounded-full border border-line px-3 py-1 text-sm font-semibold text-accent">
              {getVideoTypeLabel(video.type)}
            </span>
            {video.official && (
              <span className="glass-bar rounded-full border border-line px-3 py-1 text-sm font-semibold text-success-text">
                Resmi
              </span>
            )}
          </div>
          <h3 className="font-semibold text-lg text-primary">
            {video.name}
          </h3>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

VideoModal.displayName = 'VideoModal';

export default VideoModal;
