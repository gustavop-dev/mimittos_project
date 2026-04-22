import { api } from './http'
import type { GlobalColor, GlobalSize } from '../types'

export const globalPresetService = {
  // Sizes
  createSize: (data: { label: string; cm: string; sort_order?: number }) =>
    api.post<GlobalSize>('/sizes/', data).then((r) => r.data),
  updateSize: (id: number, data: Partial<{ label: string; cm: string; sort_order: number; is_active: boolean }>) =>
    api.patch<GlobalSize>(`/sizes/${id}/`, data).then((r) => r.data),
  deleteSize: (id: number) => api.delete(`/sizes/${id}/`),

  // Colors
  createColor: (data: { name: string; hex_code: string; sort_order?: number }) =>
    api.post<GlobalColor>('/colors/', data).then((r) => r.data),
  updateColor: (id: number, data: Partial<{ name: string; hex_code: string; sort_order: number; is_active: boolean }>) =>
    api.patch<GlobalColor>(`/colors/${id}/`, data).then((r) => r.data),
  deleteColor: (id: number) => api.delete(`/colors/${id}/`),

  // Gallery
  uploadGalleryImage: (slug: string, file: File) => {
    const fd = new FormData()
    fd.append('image', file)
    return api.post<{ id: number; url: string }>(`/peluches/${slug}/gallery/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
  deleteGalleryImage: (slug: string, attachmentId: number) =>
    api.delete(`/peluches/${slug}/gallery/${attachmentId}/`),
}
