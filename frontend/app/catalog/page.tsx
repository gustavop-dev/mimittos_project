'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useCartStore } from '@/lib/stores/cartStore'
import { useProductStore } from '@/lib/stores/productStore'

const MOCK_PRODUCTS = [
  { id: 1, img: '/mimittos/prod-01.svg', cat: 'Osito clásico', name: 'Osito Coral', tag: 'Más vendido', tagType: 'coral', price: '$85.000', colors: ['#D4848A', '#F5E6D3', '#FFD4D4', '#8B7E7E'] },
  { id: 2, img: '/mimittos/prod-02.svg', cat: 'Conejito', name: 'Conejito Lucía', tag: 'Nuevo', tagType: '', price: '$92.000', colors: ['#FFD4D4', '#FFF0E8', '#D49292'] },
  { id: 3, img: '/mimittos/prod-03.svg', cat: 'Amigo del bosque', name: 'Zorro Amiguito', tag: '', tagType: '', price: '$98.000', colors: ['#D49292', '#B8696F', '#F5E6D3'] },
  { id: 4, img: '/mimittos/prod-04.svg', cat: 'Amigo del bosque', name: 'Elefantito Dulce', tag: 'Edición limitada', tagType: 'navy', price: '$110.000', colors: ['#8B7E7E', '#FFD4D4', '#FFE5E5'] },
  { id: 5, img: '/mimittos/prod-05.svg', cat: 'Osito clásico', name: 'Osito Clásico', tag: '', tagType: '', price: '$75.000', colors: ['#B8696F', '#F5E6D3', '#D4848A'] },
  { id: 6, img: '/mimittos/prod-06.svg', cat: 'Amigo del bosque', name: 'Pandita Sueño', tag: 'Más vendido', tagType: 'coral', price: '$105.000', colors: ['#1B2A4A', '#FFFFFF', '#8B7E7E'] },
  { id: 7, img: '/mimittos/prod-07.svg', cat: 'Animal de granja', name: 'Gatito Miel', tag: '', tagType: '', price: '$88.000', colors: ['#F5E6D3', '#D6A98A', '#D49292'] },
  { id: 8, img: '/mimittos/prod-08.svg', cat: 'Animal de granja', name: 'Perrito Amigo', tag: 'Nuevo', tagType: '', price: '$94.000', colors: ['#F5E6D3', '#D6A98A', '#8B7E7E', '#FFFFFF'] },
  { id: 9, img: '/mimittos/prod-09.svg', cat: 'Amigo del bosque', name: 'Koalita Abrazo', tag: '', tagType: '', price: '$102.000', colors: ['#8B7E7E', '#FFFFFF', '#1B2A4A'] },
  { id: 10, img: '/mimittos/prod-10.svg', cat: 'Amigo del bosque', name: 'Búhito Noche', tag: 'Edición limitada', tagType: 'navy', price: '$115.000', colors: ['#1B2A4A', '#B8696F', '#F5E6D3'] },
  { id: 11, img: '/mimittos/prod-11.svg', cat: 'Animal de granja', name: 'Vacuchi Dulce', tag: '', tagType: '', price: '$99.000', colors: ['#FFFFFF', '#FFD4D4', '#D4848A'] },
  { id: 12, img: '/mimittos/prod-12.svg', cat: 'Amigo del bosque', name: 'Leoncito Sol', tag: 'Nuevo', tagType: '', price: '$118.000', colors: ['#F5E6D3', '#D6A98A', '#B8696F'] },
]

const CATEGORIES = ['Todos', 'Osito clásico', 'Conejito', 'Amigo del bosque', 'Animal de granja']

export default function CatalogPage() {
  const addToCart = useCartStore((s) => s.addToCart)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState('popular')

  const filtered = MOCK_PRODUCTS.filter((p) => activeCategory === 'Todos' || p.cat === activeCategory)

  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Catálogo</b>
      </div>

      {/* Page title */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px 30px' }}>
        <div style={eyebrowStyle}>Explora nuestra colección</div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 46, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
          Encuentra al peluche que ya te está esperando
        </h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 16, marginTop: 10, maxWidth: 600, lineHeight: 1.55 }}>
          Cada modelo está pensado para contar una historia. Filtra por categoría y descubre el que conecta contigo.
        </p>
      </div>

      {/* Main wrap */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 60px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 40 }}>
        {/* Filters */}
        <aside style={{ position: 'sticky', top: 110, alignSelf: 'start', background: '#fff', borderRadius: 'var(--radius-lg)', padding: 26, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 20 }}>Filtros</h3>

          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
            <h4 style={filterHeadStyle}>Categoría</h4>
            {CATEGORIES.map((cat) => (
              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', fontSize: 14, color: activeCategory === cat ? 'var(--coral)' : 'var(--navy)', fontWeight: activeCategory === cat ? 700 : 400 }} onClick={() => setActiveCategory(cat)}>
                <span style={{ width: 18, height: 18, borderRadius: 5, border: activeCategory === cat ? 'none' : '1.5px solid rgba(27,42,74,.15)', background: activeCategory === cat ? 'var(--coral)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all .2s' }}>
                  {activeCategory === cat && <span style={{ width: 8, height: 4, border: '2px solid #fff', borderTop: 'none', borderRight: 'none', transform: 'rotate(-45deg) translate(1px,-1px)', display: 'block' }} />}
                </span>
                {cat}
                <span style={{ marginLeft: 'auto', color: 'var(--gray-warm)', fontSize: 12 }}>
                  {cat === 'Todos' ? MOCK_PRODUCTS.length : MOCK_PRODUCTS.filter((p) => p.cat === cat).length}
                </span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
            <h4 style={filterHeadStyle}>Tamaño</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Pequeño · 20cm', 'Mediano · 35cm', 'Grande · 50cm', 'Jumbo · 70cm'].map((s) => (
                <span key={s} style={{ padding: '8px 14px', borderRadius: 999, background: 'var(--cream-peach)', fontSize: 13, fontWeight: 600, color: 'var(--navy)', cursor: 'pointer' }}>{s}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 style={filterHeadStyle}>Precio máximo</h4>
            <input type="range" min="60000" max="250000" defaultValue="180000" style={{ width: '100%', accentColor: 'var(--coral)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--navy)', fontWeight: 600, marginTop: 10 }}>
              <span>$60.000</span><span>$180.000</span>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26, flexWrap: 'wrap', gap: 14 }}>
            <div style={{ fontSize: 14, color: 'var(--gray-warm)' }}>
              <b style={{ color: 'var(--navy)', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16 }}>{filtered.length}</b> peluches encontrados
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ background: '#fff', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--navy)', fontFamily: 'inherit', cursor: 'pointer' }}
            >
              <option value="popular">Ordenar: Más populares</option>
              <option value="new">Novedades primero</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 22 }}>
            {filtered.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', cursor: 'pointer', textDecoration: 'none' }}>
                <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--pink-melo)', overflow: 'hidden' }}>
                  {p.tag && (
                    <span style={{ position: 'absolute', top: 14, left: 14, background: p.tagType === 'coral' ? 'var(--coral)' : p.tagType === 'navy' ? 'var(--navy)' : '#fff', color: p.tagType ? '#fff' : 'var(--terracotta)', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 999, boxShadow: 'var(--shadow-sm)', zIndex: 1 }}>{p.tag}</span>
                  )}
                  <Image src={p.img} alt={p.name} fill className="object-cover" />
                  <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'var(--navy)', color: '#fff', padding: 10, borderRadius: 12, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                    Ver y personalizar →
                  </div>
                </div>
                <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--coral)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>{p.cat}</div>
                  <h4 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>{p.name}</h4>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {p.colors.map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '1.5px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.08)', display: 'inline-block' }} />)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px dashed rgba(212,132,138,.2)' }}>
                    <div>
                      <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--terracotta)' }}>{p.price}</div>
                      <small style={{ fontWeight: 500, fontSize: 12, color: 'var(--gray-warm)' }}>desde</small>
                    </div>
                    <button
                      style={{ background: 'var(--coral)', color: '#fff', width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer' }}
                      onClick={(e) => { e.preventDefault(); addToCart({ id: p.id, title: p.name, price: parseInt(p.price.replace(/\D/g, '')), gallery_urls: [p.img], category: p.cat, description: '' } as any, 1) }}
                      aria-label="Agregar al carrito"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 50 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button key={n} style={{ width: 42, height: 42, borderRadius: '50%', background: n === 1 ? 'var(--coral)' : '#fff', border: '1.5px solid', borderColor: n === 1 ? 'var(--coral)' : 'rgba(27,42,74,.08)', color: n === 1 ? '#fff' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                {n}
              </button>
            ))}
          </div>
        </main>
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
