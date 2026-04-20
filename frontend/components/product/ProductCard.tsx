'use client'

import Image from 'next/image'
import Link from 'next/link'

import type { Peluch } from '@/lib/types'

const BADGE_LABELS: Record<string, string> = {
  bestseller: 'Más vendido',
  new: 'Nuevo',
  limited_edition: 'Edición limitada',
}

export default function ProductCard({ product }: { product: Peluch }) {
  const cover = product.gallery_urls[0]

  return (
    <Link
      href={`/peluches/${product.slug}`}
      className="group block border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg hover:-translate-y-0.5 transition"
    >
      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
        {product.badge !== 'none' && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: product.badge === 'limited_edition' ? '#1B2A4A' : '#D4848A', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, zIndex: 1 }}>
            {BADGE_LABELS[product.badge]}
          </span>
        )}
        {cover ? (
          <Image
            src={cover}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🧸</div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{product.category_name}</p>
        <h3 className="font-semibold mt-1 leading-tight">{product.title}</h3>
        <div className="flex gap-1 mt-2">
          {product.available_colors.slice(0, 5).map((c) => (
            <span key={c.id} style={{ width: 12, height: 12, borderRadius: '50%', background: c.hex_code, border: '1px solid rgba(0,0,0,.1)', display: 'inline-block' }} />
          ))}
        </div>
        <p className="mt-2 font-semibold text-rose-600">
          {product.min_price != null ? `$${product.min_price.toLocaleString('es-CO')}` : '—'}
        </p>
      </div>
    </Link>
  )
}
