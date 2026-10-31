import { useCallback, useState } from 'react'
import { clearRecents, getRecents } from '@utils/recents'
import type { RecentEntry } from '@utils/recents'
import { Button, PosterCard } from '@components/ui'

const RAIL_LIST_CLASS =
  '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8'

/**
 * "Son Baktıklarınız" (spec §6, fixes T): gerçek localStorage kayıtları.
 * Boşken bölüm TAMEN gizlenir; sahte kişiselleştirme/istatistik yok.
 * "Temizle" hayalet aksiyonu kayıtları siler ve rayı anında kapatır.
 */
export function RecentsRail({ className = '' }: { className?: string }) {
  const [recents, setRecents] = useState<RecentEntry[]>(() =>
    getRecents()
      .slice()
      .sort((a, b) => b.at - a.at)
  )

  const handleClear = useCallback(() => {
    clearRecents()
    setRecents([])
  }, [])

  if (recents.length === 0) return null

  return (
    <section className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">Geçmiş</p>
          <h2 className="truncate font-display text-2xl font-semibold tracking-tight text-primary">
            Son Baktıklarınız
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Temizle
        </Button>
      </div>

      <ul role="list" className={RAIL_LIST_CLASS}>
        {recents.map((entry) => (
          <li key={`${entry.media_type}-${entry.id}`} className="shrink-0 snap-start">
            <PosterCard
              item={{
                id: entry.id,
                media_type: entry.media_type,
                title: entry.title,
                poster_path: entry.poster_path,
              }}
              showMediaType
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
