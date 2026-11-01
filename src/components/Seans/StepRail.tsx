import { STEP_IDS, type StepId } from '@/lib/seans/config'

const LABELS: Record<StepId, string> = {
  kind: 'Tür',
  mood: 'Ruh hâli',
  runtime: 'Süre',
  genres: 'Türler',
  familiarity: 'Zevk',
  providers: 'Servis',
}

interface StepRailProps {
  /** Aktif adım; sonuç ekranında STEP_IDS.length. */
  current: number
}

/**
 * Adım göstergesi — dekoratif noktalar + ekran okuyucu için düz metin.
 * Tamamlanan adımlar altın, aktif adım halkalı, kalan adımlar soluk.
 */
export function StepRail({ current }: StepRailProps) {
  const total = STEP_IDS.length
  return (
    <div aria-label={`Adım ${Math.min(current + 1, total)} / ${total}`}>
      <ol className="flex items-center gap-1.5" aria-hidden="true">
        {STEP_IDS.map((id, index) => {
          const state =
            index < current ? 'done' : index === current ? 'active' : 'todo'
          return (
            <li key={id} className="flex items-center gap-1.5">
              <span
                className={`h-1.5 rounded-full motion-safe:transition-all motion-safe:duration-300 ease-cine ${
                  state === 'done'
                    ? 'w-8 bg-accent'
                    : state === 'active'
                      ? 'w-12 bg-accent'
                      : 'w-8 bg-line-strong'
                }`}
              />
              <span
                className={`hidden text-xs font-medium uppercase tracking-[0.08em] sm:inline ${
                  state === 'todo' ? 'text-muted' : 'text-secondary'
                }`}
              >
                {LABELS[id]}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
