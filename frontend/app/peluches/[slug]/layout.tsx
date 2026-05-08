import type { Metadata } from 'next'
import Script from 'next/script'

const SITE_URL = 'https://mimittos.com'
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? 'https://mimittos.com'

type PeluchDetailLite = {
  slug: string
  title: string
  description?: string
  short_description?: string
  min_price?: number | null
  discounted_min_price?: number | null
  discount_pct?: number
  badge?: string
  category_name?: string
  available_colors?: { id: number; name: string }[]
  gallery_urls?: string[]
  color_images_meta?: { preview_url?: string }[]
  is_featured?: boolean
}

async function fetchPeluch(slug: string): Promise<PeluchDetailLite | null> {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/peluches/${slug}/`, { next: { revalidate: 600 } })
    if (!res.ok) return null
    return (await res.json()) as PeluchDetailLite
  } catch {
    return null
  }
}

function trim(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await fetchPeluch(slug)
  if (!p) {
    return { title: 'Peluche no encontrado', robots: { index: false, follow: true } }
  }

  const title = `${p.title} — Peluche artesanal personalizable`
  const rawDesc =
    p.short_description ||
    p.description ||
    `Conoce el peluche ${p.title} de MIMITTOS: hecho a mano en Colombia, personalizable en tamaño, color, huella y audio.`
  const description = trim(rawDesc.replace(/\s+/g, ' ').trim(), 160)

  const cover =
    p.color_images_meta?.[0]?.preview_url ||
    p.gallery_urls?.[0] ||
    '/mimittos/logo-dark-big.png'

  return {
    title,
    description,
    alternates: { canonical: `/peluches/${p.slug}` },
    openGraph: {
      title: `${p.title} · MIMITTOS`,
      description,
      url: `${SITE_URL}/peluches/${p.slug}`,
      type: 'website',
      images: [{ url: cover, width: 1200, height: 1200, alt: p.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${p.title} · MIMITTOS`,
      description,
      images: [cover],
    },
  }
}

export default async function PeluchLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const p = await fetchPeluch(slug)

  let productJsonLd: Record<string, unknown> | null = null
  let breadcrumbJsonLd: Record<string, unknown> | null = null

  if (p) {
    const cover =
      p.color_images_meta?.[0]?.preview_url ||
      p.gallery_urls?.[0] ||
      `${SITE_URL}/mimittos/logo-dark-big.png`
    const price = p.discounted_min_price ?? p.min_price ?? null

    productJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.title,
      description: p.short_description || p.description || `Peluche artesanal MIMITTOS: ${p.title}`,
      image: cover,
      brand: { '@type': 'Brand', name: 'MIMITTOS' },
      category: p.category_name || 'Peluches artesanales',
      url: `${SITE_URL}/peluches/${p.slug}`,
      ...(price != null && {
        offers: {
          '@type': 'Offer',
          price: String(Math.round(price)),
          priceCurrency: 'COP',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/peluches/${p.slug}`,
          priceValidUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().slice(0, 10),
        },
      }),
    }

    breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${SITE_URL}/catalog` },
        { '@type': 'ListItem', position: 3, name: p.title, item: `${SITE_URL}/peluches/${p.slug}` },
      ],
    }
  }

  return (
    <>
      {children}
      {productJsonLd && (
        <Script id="product-jsonld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(productJsonLd)}
        </Script>
      )}
      {breadcrumbJsonLd && (
        <Script id="breadcrumb-jsonld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(breadcrumbJsonLd)}
        </Script>
      )}
    </>
  )
}
