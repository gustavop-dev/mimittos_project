import type { MetadataRoute } from 'next'

const SITE_URL = 'https://mimittos.com'
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? 'https://mimittos.com'

type PeluchSlug = { slug: string; updated_at?: string }

async function fetchPeluches(): Promise<PeluchSlug[]> {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/peluches/`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (Array.isArray(data)) {
      return data
        .filter((p: { slug?: string }) => typeof p.slug === 'string' && p.slug.length > 0)
        .map((p: { slug: string; updated_at?: string }) => ({ slug: p.slug, updated_at: p.updated_at }))
    }
    return []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/catalog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/blogs`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const peluches = await fetchPeluches()
  const peluchEntries: MetadataRoute.Sitemap = peluches.map((p) => ({
    url: `${SITE_URL}/peluches/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticEntries, ...peluchEntries]
}
