import { UsersIcon } from '@heroicons/react/24/outline'
import { Button, EmptyState } from '@components/ui'
import { useSEO } from '@hooks/useSEO'

/** Turkish-branded person 404 — rendered for unknown /person/* routes and API 404s. */
function Person404() {
  useSEO({ title: 'Kişi Bulunamadı', description: 'Aradığınız kişi LMDB üzerinde bulunamadı.' })

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <p
          aria-hidden="true"
          className="mb-2 font-display text-6xl font-semibold tabular-nums tracking-tight text-accent"
        >
          404
        </p>
        <EmptyState
          title="Kişi bulunamadı"
          hint="Aradığınız kişi taşınmış ya da hiç var olmamış olabilir. Popüler kişilere göz atabilir veya arama yapabilirsiniz."
          icon={<UsersIcon className="h-10 w-10" />}
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button to="/person">Popüler Kişiler</Button>
              <Button variant="ghost" to="/">
                Ana Sayfa
              </Button>
            </div>
          }
        />
      </div>
    </div>
  )
}

export default Person404
