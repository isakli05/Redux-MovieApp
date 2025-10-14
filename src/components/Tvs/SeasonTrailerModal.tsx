import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SeasonVideo } from '../../types/seasonVideos';

interface SeasonTrailerModalProps {
  video: SeasonVideo;
  allVideos?: SeasonVideo[];
  onClose: () => void;
  onVideoChange?: (video: SeasonVideo) => void;
}

function SeasonTrailerModal({ video, allVideos, onClose, onVideoChange }: SeasonTrailerModalProps) {
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-slate-800/50 backdrop-blur-lg 
                     border border-slate-700/50 text-white hover:bg-slate-700/50 transition-colors z-10"
          aria-label="Kapat"
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
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold">
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

        {/* Video List (if multiple videos) */}
        {allVideos && allVideos.length > 1 && onVideoChange && (
          <div className="mt-4 p-4 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl">
            <h4 className="text-white font-semibold mb-3">Diğer Videolar</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
              {allVideos.filter(v => v.id !== video.id).map((v) => (
                <button
                  key={v.id}
                  onClick={() => onVideoChange(v)}
                  className="group relative aspect-video rounded-lg overflow-hidden bg-slate-700/50 
                             hover:bg-slate-700 transition-colors"
                >
                  <img
                    src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
                    alt={v.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-xs font-medium line-clamp-2">
                      {v.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeasonTrailerModal;
