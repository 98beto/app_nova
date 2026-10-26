import type { LocationQuery } from 'vue-router'
import type { CatalogueBundle, StoreApplication } from '@/types/store'

export function catalogueQuery(query: LocationQuery): string {
  const params = new URLSearchParams()
  for (const key of ['search', 'category', 'free', 'sort', 'page']) {
    const value = query[key]
    if (typeof value === 'string' && value) params.set(key, value)
  }
  return params.toString()
}

export function filtersFromQuery(query: LocationQuery) {
  const sorts: CatalogueBundle['filters']['sort'][] = ['newest', 'rating', 'downloads', 'trending']
  return {
    search: typeof query.search === 'string' ? query.search : '',
    category: typeof query.category === 'string' ? query.category : '',
    free: query.free === '1' || query.free === '0' ? query.free : '',
    sort: sorts.includes(query.sort as CatalogueBundle['filters']['sort'])
      ? String(query.sort)
      : 'newest',
  }
}

export function priceLabel(app: StoreApplication) {
  return app.is_free ? 'Gratis' : `$${app.price} USD`
}
export function ratingLabel(rating: number | null) {
  return rating === null ? 'Sin valoraciones' : rating.toFixed(1)
}
export function dateLabel(date: string | null) {
  return date ? new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(date)) : '—'
}
export const statusLabels: Record<StoreApplication['status'], string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  approved: 'Publicada',
  rejected: 'Rechazada',
  unpublished: 'No publicada',
}
export function imageError(file: File, maxMB = 5): string {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Selecciona una imagen JPG, PNG o WebP.'
  if (file.size > maxMB * 1024 * 1024) return `La imagen debe pesar como máximo ${maxMB} MB.`
  return ''
}
