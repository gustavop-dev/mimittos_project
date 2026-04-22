import { api } from './http'
import type { UserListItem } from '../types'

export const userAdminService = {
  list: () => api.get<UserListItem[]>('/users/').then((r) => r.data),

  update: (id: number, data: { role?: string; is_staff?: boolean; is_active?: boolean }) =>
    api.patch<UserListItem>(`/users/${id}/`, data).then((r) => r.data),
}
