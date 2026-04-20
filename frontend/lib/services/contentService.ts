import { api } from './http'

type SiteContentKey = 'faq' | 'history' | 'terms' | 'welcome_text' | 'contact_info'

export const contentService = {
  get: (key: SiteContentKey) =>
    api.get<{ key: string; content_json: unknown }>(`/content/${key}/`).then((r) => r.data),
}
