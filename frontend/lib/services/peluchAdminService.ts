import { api } from './http'
import type { ColorImageItem, PeluchDetail } from '../types'

interface SizePricePayload {
  size_id: number
  price: number
  is_available: boolean
}

interface PeluchPayload {
  title: string
  slug: string
  category: number
  lead_description: string
  description: string[]
  badge: string
  is_active: boolean
  is_featured: boolean
  discount_pct?: number
  display_order?: number
  has_huella: boolean
  has_corazon: boolean
  has_audio: boolean
  huella_extra_cost: number
  corazon_extra_cost: number
  audio_extra_cost: number
  available_color_ids: number[]
  size_prices_data: SizePricePayload[]
  specifications?: Record<string, string>
  care_instructions?: string[]
}

export const peluchAdminService = {
  listAll: () =>
    api.get<PeluchDetail[]>('/peluches/').then((r) => r.data),

  create: (data: PeluchPayload) =>
    api.post<PeluchDetail>('/peluches/', data).then((r) => r.data),

  update: (slug: string, data: Partial<PeluchPayload>) =>
    api.patch<PeluchDetail>(`/peluches/${slug}/`, data).then((r) => r.data),

  delete: (slug: string) =>
    api.delete(`/peluches/${slug}/`),

  getColorImages: (slug: string, colorSlug: string) =>
    api.get<ColorImageItem[]>(`/peluches/${slug}/color-image/${colorSlug}/`).then((r) => r.data),

  uploadColorImage: (slug: string, colorSlug: string, file: File) => {
    const fd = new FormData()
    fd.append('image', file)
    return api.post<{ id: number; color_id: number; url: string }>(
      `/peluches/${slug}/color-image/${colorSlug}/`, fd
    ).then((r) => r.data)
  },

  deleteColorImage: (slug: string, colorSlug: string, pciId: number) =>
    api.delete(`/peluches/${slug}/color-image/${colorSlug}/${pciId}/`),

  bulkUpdateCategory: (slugList: string[], categoryId: number) =>
    api.patch<{ updated: number }>('/peluches/bulk-category/', { slug_list: slugList, category_id: categoryId })
      .then((r) => r.data),
}
