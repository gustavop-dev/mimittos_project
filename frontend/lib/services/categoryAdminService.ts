import { api } from './http'
import type { Category } from '../types'

export const categoryAdminService = {
  create: (formData: FormData) =>
    api.post<Category>('/categories/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  update: (id: number, formData: FormData) =>
    api.patch<Category>(`/categories/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/categories/${id}/`),
}
