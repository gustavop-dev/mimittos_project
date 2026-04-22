import { api } from './http'
import type { Category, ColorImageItem, GlobalColor, GlobalSize, Peluch, PeluchDetail, Review } from '../types'

export const peluchService = {
  listPeluches: (params?: {
    category?: string
    size?: string
    color?: string
    min_price?: number
    max_price?: number
    has_huella?: boolean
    has_audio?: boolean
    sort?: 'popular' | 'new' | 'price_asc' | 'price_desc' | 'top_rated'
  }) => api.get<Peluch[]>('/peluches/', { params }).then((r) => r.data),

  getFeatured: () => api.get<Peluch[]>('/peluches/featured/').then((r) => r.data),

  getPeluchBySlug: (slug: string) =>
    api.get<PeluchDetail>(`/peluches/${slug}/`).then((r) => r.data),

  getCategories: () => api.get<Category[]>('/categories/').then((r) => r.data),

  getSizes: () => api.get<GlobalSize[]>('/sizes/').then((r) => r.data),

  getColors: () => api.get<GlobalColor[]>('/colors/').then((r) => r.data),

  getReviews: (slug: string) =>
    api.get<Review[]>(`/peluches/${slug}/reviews/`).then((r) => r.data),

  createReview: (slug: string, data: { rating: number; comment: string; order_id?: number }) =>
    api.post<Review>(`/peluches/${slug}/reviews/`, data).then((r) => r.data),

  getColorImages: (slug: string, colorSlug: string) =>
    api.get<ColorImageItem[]>(`/peluches/${slug}/color-image/${colorSlug}/`).then((r) => r.data),
}
