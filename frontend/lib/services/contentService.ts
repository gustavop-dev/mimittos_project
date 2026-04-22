import { api } from './http'

export type ContentKey = 'faq' | 'history' | 'terms' | 'welcome_text' | 'contact_info'

export interface SiteContent {
  key: ContentKey
  content_json: Record<string, unknown>
  updated_at: string
}

export const contentService = {
  get: (key: ContentKey) =>
    api.get<SiteContent>(`/content/${key}/`).then((r) => r.data),

  update: (key: ContentKey, content_json: Record<string, unknown>) =>
    api.put<SiteContent>(`/content/${key}/`, { content_json }).then((r) => r.data),
}
