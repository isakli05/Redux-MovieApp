import { Link } from 'react-router-dom'
import { useGetMovieCollectionQuery } from '@api/endpoints/movies.endpoints'
import { getPosterUrl } from '@utils/image.utils'
import { slugify } from '@utils/slug.utils'
import { Button, Skeleton } from '@components/ui'

export interface CollectionBandProps {
  collectionId: number
  className?: string
}

/**
 * "Part of a collection" band on the movie dossier (spec §6.11 keeps the
 * collection PAGE separate): first five part posters + a link to
 * /collection/:id. Hidden when the collection fetch comes back empty.
 */
export function CollectionBand({ collectionId, className = '' }: CollectionBandProps) {
  const { data, isLoading } = useGetMovieCollectionQuery(String(collectionId), {
    skip: !collectionId,
  })

  if (isLoading) {
    return (
      <section className={className} aria-busy="true">
        <Skeleton variant="card" className="h-40" />
      </section>
    )
  }

  if (!data || data.parts.length === 0) return null

  return (
    <section
      className={`overflow-hidden rounded-xl border border-line bg-surface-base ${className}`}
      aria-label="Koleksiyon"
    >
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-accent">Koleksiyon</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-primary">{data.name}</h3>
          <p className="mt-1 text-sm text-secondary">
            {data.parts.length} filmden oluşuyor
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            to={`/collection/${data.id}-${slugify(data.name)}-collection`}
          >
            Koleksiyonu Görüntüle
          </Button>
        </div>

        <ul role="list" className="flex shrink-0 gap-3">
          {data.parts.slice(0, 5).map((part) => (
            <li key={part.id} className="w-20 sm:w-24">
              <Link
                to={`/movie/${part.id}`}
                className="group block"
                title={part.title}
              >
                <div className="aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface-raised transition-[transform,border-color] duration-250 ease-cine group-hover:-translate-y-1 group-hover:border-accent">
                  {part.poster_path ? (
                    <img
                      src={getPosterUrl(part.poster_path, 'SMALL')}
                      alt={`${part.title} afişi`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-secondary">
                      {part.title.charAt(0)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
