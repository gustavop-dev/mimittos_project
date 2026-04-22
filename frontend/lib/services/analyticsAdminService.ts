import { api } from './http'

export interface DashboardData {
  daily_orders: Array<{ date: string; orders: number; revenue: number }>
  top_peluches: Array<{ title: string; total_sold: number; slug: string }>
  new_vs_returning: { new: number; returning: number }
  device_types: { mobile: number; desktop: number; tablet: number }
  traffic_sources: Record<string, number>
  confirmed_revenue: number
  total_orders: number
  orders_by_status: Record<string, number>
}

export const analyticsAdminService = {
  getDashboard: (dateFrom?: string, dateTo?: string) => {
    const params: Record<string, string> = {}
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    return api.get<DashboardData>('/analytics/dashboard/', { params }).then((r) => r.data)
  },

  exportOrdersCSV: (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    return api.get(`/analytics/export/orders/?${params.toString()}`, { responseType: 'blob' })
      .then((r) => {
        const url = URL.createObjectURL(r.data as Blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pedidos-${dateFrom ?? 'all'}.csv`
        a.click()
        URL.revokeObjectURL(url)
      })
  },
}
