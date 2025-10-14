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
    const closeButton = document.querySelector('[aria-label="Close Video"]') as HTMLElement;
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
        className="relative w-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 text-white hover:bg-slate-700/50 transition-colors z-10"
          aria-label="Close Video"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Video Container */}
        <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0`}
            title={video.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Video Info */}
        <div className="mt-4 p-4 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl">
          <h2 id="video-modal-title" className="sr-only">{video.name}</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-semibold">
              {getVideoTypeLabel(video.type)}
            </span>
            {video.official && (
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold">
                Resmi
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-lg">
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
