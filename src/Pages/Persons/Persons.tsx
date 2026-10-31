import { useCallback, useEffect, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useGetPopularPersonsQuery } from '@/api/endpoints/persons.endpoints'
import { useSEO } from '@hooks/useSEO'
import { Button, EmptyState, ErrorState } from '@components/ui'
import { PersonCard, PersonCardSkeleton } from '@components/Persons/PersonCard'
import type { Result as PopularPerson } from '@/types/popularPersons'

/** Hybrid load: auto-load (IntersectionObserver) for the first pages, then a manual button. */
const AUTO_LOAD_PAGE_LIMIT = 5
const MAX_PAGES_IN_MEMORY = 15
const ITEMS_PER_PAGE = 20

/** Secondary card line: department when present, else the best known-for work. */
function subtitleOf(person: PopularPerson): string {
  const department = (person as { known_for_department?: string }).known_for_department
  if (department) return department
  const first = person.known_for?.find((item) => item.title || item.name)
  return first?.title || first?.name || ''
}

function Persons() {
  const [page, setPage] = useState(1)
  const [accumulated, setAccumulated] = useState<PopularPerson[]>([])
  const [hasMore, setHasMore] = useState(true)
  const isInitialLoad = useRef(true)

  const { data, isLoading, isFetching, error, refetch } = useGetPopularPersonsQuery(page)

  useSEO({
    title: 'İnsanlar',
    description: 'Popüler oyuncular, yönetmenler ve ekip üyeleri — LMDB kişi kataloğu.',
  })

  // Accumulate unique persons across pages (memory-capped, mirrors /movie catalog UX)
  useEffect(() => {
    if (!data?.results) return
    setAccumulated((prev) => {
      const existingIds = new Set(prev.map((p) => p.id))
      const fresh = data.results.filter((p) => !existingIds.has(p.id))
      const updated = [...prev, ...fresh]
      const cap = MAX_PAGES_IN_MEMORY * ITEMS_PER_PAGE
      return updated.length > cap ? updated.slice(-cap) : updated
    })
    setHasMore(page < data.total_pages)
    isInitialLoad.current = false
  }, [data, page])

  const handleLoadMore = useCallback(() => {
    if (data && page < data.total_pages && !isFetching) {
      setPage((prev) => prev + 1)
    }
  }, [data, page, isFetching])

  const loadMoreRef = useRef<HTMLDivElement>(null)

  const showInitialSkeleton = isLoading && isInitialLoad.current
  const isEmpty = !isLoading && !error && accumulated.length === 0
  const listVisible = !isEmpty && !showInitialSkeleton

  // Auto-load while within the first pages; guarded for jsdom / older browsers.
  // Re-runs when the list (and therefore the sentinel) becomes visible.
  useEffect(() => {
    if (!listVisible) return
    if (typeof IntersectionObserver === 'undefined') return
    const target = loadMoreRef.current
    if (!target || !hasMore || isFetching || page >= AUTO_LOAD_PAGE_LIMIT) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetching && page < AUTO_LOAD_PAGE_LIMIT) {
          handleLoadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [listVisible, hasMore, isFetching, page, handleLoadMore])

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] items-center justify-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title="Kişiler yüklenemedi"
          message="Popüler kişiler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
          onRetry={refetch}
          backTo="/kesfet"
          backLabel="Keşfet'e Dön"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">Keşfet</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            İnsanlar
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Popüler oyuncular, yönetmenler ve ekip üyeleri
          </p>
        </div>
        <Button variant="outline" size="sm" to="/search?category=person">
          <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
          Kişi Ara
        </Button>
      </header>

      {/* Grid */}
      {isEmpty ? (
        <EmptyState
          title="Kişi bulunamadı"
          hint="Popüler kişiler şu anda görüntülenemiyor. Aradığınız belirli bir kişiyi aramayı deneyin."
          action={
            <Button variant="outline" size="sm" to="/search?category=person">
              Kişi Ara
            </Button>
          }
        />
      ) : (
        <div className="mt-10">
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {showInitialSkeleton
              ? Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                  <PersonCardSkeleton key={`skeleton-${index}`} />
                ))
              : accumulated.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={{
                      id: person.id,
                      name: person.name,
                      profilePath: person.profile_path ?? null,
                      subtitle: subtitleOf(person),
                    }}
                  />
                ))}
          </div>

          {/* Auto-load sentinel (first pages) */}
          <div ref={loadMoreRef} className="h-20" />

          {isFetching && !showInitialSkeleton && (
            <p className="mt-6 text-center text-sm text-secondary" role="status">
              Daha fazla kişi yükleniyor…
            </p>
          )}

          {hasMore && page >= AUTO_LOAD_PAGE_LIMIT && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                loading={isFetching}
                onClick={handleLoadMore}
              >
                Daha Fazla Yükle
              </Button>
            </div>
          )}

          {!hasMore && accumulated.length > 0 && (
            <div className="mt-12 flex flex-col items-center gap-3">
              <p className="text-sm text-secondary">Tüm kişiler görüntülendi</p>
              <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0 })}>
                Başa Dön
              </Button>
            </div>
          )}

          {data && accumulated.length > 0 && (
            <p className="mt-8 text-center text-xs tabular-nums text-muted">
              {accumulated.length.toLocaleString('tr-TR')} /{' '}
              {data.total_results.toLocaleString('tr-TR')} kişi görüntüleniyor
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Persons
