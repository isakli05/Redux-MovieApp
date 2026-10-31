import { useEffect } from 'react'

interface SEOOptions {
  /** Page title — rendered as "{title} · LMDB" */
  title?: string
  description?: string
  /** Absolute TMDB image path (starts with /) or full URL, used for og:image */
  image?: string | null
}

const SITE_NAME = 'LMDB'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w780'

function upsertMeta(selector: string, attr: string, value: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, value)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Per-route document metadata (fixes defect U). Turkish titles expected. */
export function useSEO({ title, description, image }: SEOOptions) {
  useEffect(() => {
    if (title) document.title = `${title} · ${SITE_NAME}`
    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description)
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
    }
    if (image) {
      const url = image.startsWith('http') ? image : `${IMAGE_BASE}${image}`
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', url)
    }
    if (title) upsertMeta('meta[property="og:title"]', 'property', 'og:title', `${title} · ${SITE_NAME}`)
  }, [title, description, image])
}
