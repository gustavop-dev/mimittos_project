'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { peluchService } from '@/lib/services/peluchService'
import type { Category, GlobalSize, Peluch } from '@/lib/types'

const BADGE_LABELS: Record<string, string> = {
  bestseller: 'Más vendido',
  new: 'Nuevo',
  limited_edition: 'Edición limitada',
}

const SORT_OPTIONS = [
  { value: 'popular', label: 'Más populares' },
  { value: 'new', label: 'Novedades primero' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'top_rated', label: 'Mejor valorados' },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]['value']

function fmt(n: number | null) {
  if (n == null) return '—'
  return '$' + n.toLocaleString('es-CO')
}

export default function CatalogPage() {
  const [peluches, setPeluches] = useState<Peluch[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sizes, setSizes] = useState<GlobalSize[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [activeCategory, setActiveCategory] = useState('')
  const [activeSize, setActiveSize] = useState('')
  const [maxPrice, setMaxPrice] = useState(250000)
  const [filterHuella, setFilterHuella] = useState(false)
  const [sortBy, setSortBy] = useState<SortValue>('popular')

  useEffect(() => {
    Promise.all([peluchService.getCategories(), peluchService.getSizes()]).then(([cats, szs]) => {
      setCategories(cats)
      setSizes(szs)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    peluchService
      .listPeluches({
        category: activeCategory || undefined,
        size: activeSize || undefined,
        max_price: maxPrice < 250000 ? maxPrice : undefined,
        has_huella: filterHuella || undefined,
        sort: sortBy,
      })
      .then(setPeluches)
      .finally(() => setLoading(false))
  }, [activeCategory, activeSize, maxPrice, filterHuella, sortBy])

  const filterPanel = (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 26, boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 20 }}>Filtros</h3>

      {/* Categories */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
        <h4 style={filterHeadStyle}>Categoría</h4>
        <label style={filterLabelStyle(activeCategory === '')} onClick={() => setActiveCategory('')}>
          <span style={checkboxStyle(activeCategory === '')} />
          Todos
          <span style={{ marginLeft: 'auto', color: 'var(--gray-warm)', fontSize: 12 }}>{peluches.length}</span>
        </label>
        {categories.map((cat) => (
          <label key={cat.id} style={filterLabelStyle(activeCategory === cat.slug)} onClick={() => setActiveCategory(activeCategory === cat.slug ? '' : cat.slug)}>
            <span style={checkboxStyle(activeCategory === cat.slug)} />
            {cat.name}
          </label>
        ))}
      </div>

      {/* Sizes */}
      {sizes.length > 0 && (
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
          <h4 style={filterHeadStyle}>Tamaño</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sizes.map((s) => (
              <span
                key={s.id}
                onClick={() => setActiveSize(activeSize === s.slug ? '' : s.slug)}
                style={{ padding: '8px 14px', borderRadius: 999, background: activeSize === s.slug ? 'var(--coral)' : 'var(--cream-peach)', color: activeSize === s.slug ? '#fff' : 'var(--navy)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {s.label} · {s.cm}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
        <h4 style={filterHeadStyle}>Precio máximo</h4>
        <input
          type="range"
          min="60000"
          max="250000"
          step="10000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--coral)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--navy)', fontWeight: 600, marginTop: 10 }}>
          <span>$60.000</span>
          <span>{fmt(maxPrice)}</span>
        </div>
      </div>

      {/* Huella filter */}
      <div>
        <h4 style={filterHeadStyle}>Personalización</h4>
        <label style={{ ...filterLabelStyle(filterHuella), display: 'flex', cursor: 'pointer' }} onClick={() => setFilterHuella(!filterHuella)}>
          <span style={checkboxStyle(filterHuella)} />
          Solo con huella 🐾
        </label>
      </div>
    </div>
  )

  return (
    <main>
      {/* Breadcrumb */}
      <div className="mx-auto px-4 sm:px-8 lg:px-10 py-5" style={{ maxWidth: 1360, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Catálogo</b>
      </div>

      {/* Page title */}
      <div className="mx-auto px-4 sm:px-8 lg:px-10 pb-8" style={{ maxWidth: 1360 }}>
        <div style={eyebrowStyle}>Explora nuestra colección</div>
        <h1 className="text-[30px] sm:text-[38px] lg:text-[46px]" style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
          Descubre el peluche que hará inolvidable tu historia
        </h1>
        <p className="text-[15px] sm:text-[16px]" style={{ color: 'var(--gray-warm)', marginTop: 10, maxWidth: 600, lineHeight: 1.55 }}>
          Diseñamos abrazos que se convierten en recuerdos. Explora nuestras colecciones y encuentra el que conecta contigo.
        </p>
      </div>

      {/* Mobile filter toggle */}
      <div className="lg:hidden mx-auto px-4 sm:px-8 pb-4" style={{ maxWidth: 1360 }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid rgba(212,132,138,.3)', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 700, color: 'var(--navy)', cursor: 'pointer', fontFamily: "'Quicksand', sans-serif", boxShadow: 'var(--shadow-sm)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          {(activeCategory || activeSize || filterHuella || maxPrice < 250000) && (
            <span style={{ background: 'var(--coral)', color: '#fff', borderRadius: 999, width: 20, height: 20, display: 'grid', placeItems: 'center', fontSize: 11 }}>!</span>
          )}
        </button>

        {showFilters && (
          <div className="mt-4">
            {filterPanel}
          </div>
        )}
      </div>

      {/* Main wrap */}
      <div className="mx-auto px-4 sm:px-8 lg:px-10 pb-16" style={{ maxWidth: 1360 }}>
        <div className="lg:grid lg:gap-10" style={{ gridTemplateColumns: '280px 1fr' }}>
          {/* Sidebar filters — desktop only */}
          <aside className="hidden lg:block" style={{ position: 'sticky', top: 110, alignSelf: 'start' }}>
            {filterPanel}
          </aside>

          {/* Grid */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26, flexWrap: 'wrap', gap: 14 }}>
              <div style={{ fontSize: 14, color: 'var(--gray-warm)' }}>
                <b style={{ color: 'var(--navy)', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16 }}>{peluches.length}</b> peluches encontrados
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortValue)}
                style={{ background: '#fff', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--navy)', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>Ordenar: {label}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-warm)' }}>Cargando peluches...</div>
            ) : peluches.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 48 }}>🧸</div>
                <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--navy)', margin: '16px 0 8px' }}>Sin peluches en esta búsqueda</h3>
                <p style={{ color: 'var(--gray-warm)' }}>Prueba con otros filtros</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {peluches.map((p) => {
                  const cover = p.color_images_meta?.[0]?.preview_url ?? p.gallery_urls[0]
                  return (
                    <Link key={p.id} href={`/peluches/${p.slug}`} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', cursor: 'pointer', textDecoration: 'none' }}>
                      <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--pink-melo)', overflow: 'hidden' }}>
                        {p.badge !== 'none' && (
                          <span style={{ position: 'absolute', top: 10, left: 10, background: p.badge === 'limited_edition' ? 'var(--navy)' : 'var(--coral)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: 999, zIndex: 1 }}>
                            {BADGE_LABELS[p.badge]}
                          </span>
                        )}
                        {p.discount_pct > 0 && (
                          <span style={{ position: 'absolute', top: 10, right: 10, background: 'var(--terracotta)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 9px', borderRadius: 999, zIndex: 1 }}>
                            -{p.discount_pct}%
                          </span>
                        )}
                        {cover ? (
                          <Image src={cover} alt={p.title} fill style={{ objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 40 }}>🧸</div>
                        )}
                        <div className="hidden sm:flex" style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'var(--navy)', color: '#fff', padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                          Ver y personalizar →
                        </div>
                      </div>
                      <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 10, color: 'var(--coral)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>{p.category_name}</div>
                        <h4 className="text-[15px] sm:text-[17px]" style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--navy)', margin: 0 }}>{p.title}</h4>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {p.available_colors.slice(0, 6).map((c) => (
                            <span key={c.id} style={{ width: 12, height: 12, borderRadius: '50%', background: c.hex_code, border: '1.5px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.08)', display: 'inline-block' }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px dashed rgba(212,132,138,.2)' }}>
                          <div>
                            {p.discount_pct > 0 ? (
                              <>
                                <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--terracotta)' }}>{fmt(p.discounted_min_price)}</div>
                                <div style={{ textDecoration: 'line-through', fontSize: 11, color: 'var(--gray-warm)' }}>{fmt(p.min_price)}</div>
                              </>
                            ) : (
                              <>
                                <small style={{ fontWeight: 500, fontSize: 11, color: 'var(--gray-warm)', display: 'block', marginBottom: 1 }}>desde</small>
                                <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--terracotta)' }}>{fmt(p.min_price)}</div>
                              </>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {p.has_huella && <span title="Huella personalizada" style={{ fontSize: 14 }}>🐾</span>}
                            {p.has_audio && <span title="Audio personalizado" style={{ fontSize: 14 }}>🔊</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif",
  fontWeight: 600, fontSize: 13, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
}

const filterHeadStyle: React.CSSProperties = {
  fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13,
  color: 'var(--navy)', marginBottom: 14, letterSpacing: '.04em', textTransform: 'uppercase',
}

function filterLabelStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
    cursor: 'pointer', fontSize: 14,
    color: active ? 'var(--coral)' : 'var(--navy)',
    fontWeight: active ? 700 : 400,
  }
}

function checkboxStyle(active: boolean): React.CSSProperties {
  return {
    width: 18, height: 18, borderRadius: 5,
    border: active ? 'none' : '1.5px solid rgba(27,42,74,.15)',
    background: active ? 'var(--coral)' : 'transparent',
    display: 'inline-block', flexShrink: 0, transition: 'all .2s',
  }
}
