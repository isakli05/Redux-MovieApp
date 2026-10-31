import { useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import type { SeasonVideo } from '../../types/seasonVideos'
import { Button } from '../ui'

interface SeasonTrailerModalProps {
  video: SeasonVideo
  allVideos?: SeasonVideo[]
  onClose: () => void
  onVideoChange?: (video: SeasonVideo) => void
}

const videoTypeLabels: Record<string, string> = {
  Trailer: 'Fragman',
  Teaser: 'Tanıtım',
  Clip: 'Klip',
  'Behind the Scenes': 'Kamera Arkası',
  Featurette: 'Özel İçerik',
  Bloopers: 'Hata Payı',
}

const getVideoTypeLabel = (type: string) => videoTypeLabels[type] || type

function SeasonTrailerModal({ video, allVideos, onClose, onVideoChange }: SeasonTrailerModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // ESC ile kapatma + odak yönetimi
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeydown)
    dialogRef.current?.focus()
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [onClose])

  // Modal açıkken arka plan kaydırmasını kilitle
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const otherVideos = allVideos?.filter((v) => v.id !== video.id) ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-void/90 p-4 animate-fadeIn"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${video.name} oynatıcı`}
        tabIndex={-1}
        className="relative w-full max-w-5xl outline-none animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat */}
        <div className="absolute -top-11 right-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            aria-label="Kapat"
            className="border-line-strong bg-surface-raised"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            Kapat
          </Button>
        </div>

        {/* Oynatıcı */}
        <div className="overflow-hidden rounded-xl border border-line shadow-cine">
          <div className="relative aspect-video bg-surface-void">
            <iframe
              src={`https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0`}
              title={video.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Video Bilgisi */}
        <div className="mt-4 rounded-xl border border-line bg-surface-raised p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full border border-accent px-3 py-1 text-xs font-semibold text-accent">
              {getVideoTypeLabel(video.type)}
            </span>
            {video.official && (
              <span className="rounded-full border border-line-strong px-3 py-1 text-xs font-semibold text-secondary">
                Resmi
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-semibold text-primary">{video.name}</h3>
        </div>

        {/* Diğer videolar */}
        {otherVideos.length > 0 && onVideoChange && (
          <div className="mt-4 rounded-xl border border-line bg-surface-raised p-4">
            <h4 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.08em] text-secondary">
              Diğer Videolar
            </h4>
            <div className="grid max-h-48 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
              {otherVideos.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onVideoChange(v)}
                  className="group relative aspect-video overflow-hidden rounded-lg border border-line bg-surface-overlay transition-colors duration-150 ease-cine hover:border-accent"
                >
                  <img
                    src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
                    alt={v.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-surface-void/90 via-surface-void/40 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 text-left">
                    <p className="line-clamp-2 text-xs font-medium text-primary">{v.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SeasonTrailerModal
