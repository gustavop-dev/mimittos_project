import { api } from './http'
import type { Category } from '../types'

interface CategoryPayload {
  name: string
  description?: string
  display_order?: number
  is_active?: boolean
}

export const categoryAdminService = {
  create: (data: CategoryPayload) =>
    api.post<Category>('/categories/', data).then((r) => r.data),

  update: (id: number, data: Partial<CategoryPayload>) =>
    api.patch<Category>(`/categories/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/categories/${id}/`),
}
