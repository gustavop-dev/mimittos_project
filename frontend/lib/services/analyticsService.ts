import { api } from './http'

export const analyticsService = {
  recordPageView: (data: {
    url_path: string
    session_id: string
    peluch_slug?: string
    is_new_visitor: boolean
    device_type: 'mobile' | 'tablet' | 'desktop'
    traffic_source: 'instagram' | 'google' | 'whatsapp' | 'direct' | 'other'
    city?: string
  }) => api.post('/analytics/pageview/', data).catch(() => null),
}
