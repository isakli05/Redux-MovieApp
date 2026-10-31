import { Skeleton } from '@components/ui'

/**
 * Detail-page skeleton: hero block + poster slot + title lines + chips + a
 * tab strip — the dossier silhouette at a glance (fixes the infinite
 * spinner family, defect P: loading must never be a bare spinner).
 */
export function DetailSkeleton() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <div className="relative min-h-[62vh] bg-surface-base md:min-h-[72vh]">
        <div className="shimmer absolute inset-0 motion-safe:animate-shimmer" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
            <div className="flex items-end gap-8">
              <Skeleton variant="poster" className="hidden w-52 md:block lg:w-64" />
              <div className="w-full max-w-xl space-y-4 pb-2">
                <Skeleton variant="line" className="h-10 w-3/4" />
                <Skeleton variant="line" className="w-1/3" />
                <div className="flex gap-2 pt-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} variant="line" className="h-8 w-20 rounded-full" />
                  ))}
                </div>
                <Skeleton variant="line" className="h-10 w-48 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <Skeleton variant="line" className="w-full" />
          <Skeleton variant="line" className="w-11/12" />
          <Skeleton variant="line" className="w-2/3" />
        </div>
        <div className="mt-10 flex gap-1 border-b border-line">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="line" className="h-10 w-24 rounded-none" />
          ))}
        </div>
        <span className="sr-only">Detaylar yükleniyor…</span>
      </div>
    </div>
  )
}
