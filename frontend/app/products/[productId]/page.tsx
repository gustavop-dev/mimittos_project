'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { useCartStore } from '@/lib/stores/cartStore'

const SIZES = [
  { label: 'Pequeño', cm: '20cm', price: 85000 },
  { label: 'Mediano', cm: '35cm', price: 128000 },
  { label: 'Grande', cm: '50cm', price: 168000 },
  { label: 'Jumbo', cm: '70cm', price: 220000 },
]

const COLORS = [
  { name: 'Rosa Coral', hex: '#D4848A' },
  { name: 'Rosa Pastel', hex: '#FFD4D4' },
  { name: 'Terracota', hex: '#B8696F' },
  { name: 'Beige', hex: '#F5E6D3' },
  { name: 'Gris Cálido', hex: '#8B7E7E' },
  { name: 'Navy', hex: '#1B2A4A' },
]

const GALLERY = ['/mimittos/gal-01.svg', '/mimittos/gal-02.svg', '/mimittos/gal-03.svg', '/mimittos/gal-04.svg']

const TABS = ['Descripción', 'Especificaciones', 'Cuidados']

export default function ProductDetailPage() {
  const addToCart = useCartStore((s) => s.addToCart)
  const [activeSize, setActiveSize] = useState(1)
  const [activeColor, setActiveColor] = useState(0)
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState(0)
  const [activeImg, setActiveImg] = useState(0)
  const [extraName, setExtraName] = useState(false)
  const [extraBox, setExtraBox] = useState(false)
  const [extraNote, setExtraNote] = useState(false)
  const [nameText, setNameText] = useState('')
  const [addedToast, setAddedToast] = useState(false)

  const extras = (extraName ? 18000 : 0) + (extraBox ? 15000 : 0) + (extraNote ? 8000 : 0)
  const total = (SIZES[activeSize].price + extras) * qty
  const deposit = Math.round(total / 2)

  function fmt(n: number) { return '$' + n.toLocaleString('es-CO') }

  function handleAdd() {
    addToCart({
      id: 1,
      title: 'Osito Coral',
      price: SIZES[activeSize].price + extras,
      gallery_urls: GALLERY,
      category: 'Osito clásico',
      description: `${SIZES[activeSize].label} · ${COLORS[activeColor].name}`,
      quantity: qty,
    } as any)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <Link href="/catalog" style={{ color: 'var(--gray-warm)' }}>Catálogo</Link>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Osito Coral</b>
      </div>

      {/* Product wrap */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 60px', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 56, alignItems: 'flex-start' }}>
        {/* Gallery */}
        <div style={{ position: 'sticky', top: 110 }}>
          <div style={{ aspectRatio: '1/1', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: COLORS[activeColor].hex + '22', boxShadow: 'var(--shadow-md)', position: 'relative', transition: 'background .3s' }}>
            <span style={{ position: 'absolute', top: 20, right: 20, background: 'var(--coral)', color: '#fff', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 999, letterSpacing: '.08em', textTransform: 'uppercase', zIndex: 1 }}>
              Más vendido
            </span>
            <Image src={GALLERY[activeImg]} alt="Osito Coral" fill className="object-cover" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 14 }}>
            {GALLERY.map((src, i) => (
              <div key={i} onClick={() => setActiveImg(i)} style={{ aspectRatio: '1/1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer', border: `2.5px solid ${i === activeImg ? 'var(--coral)' : 'transparent'}`, transition: 'border-color .2s', position: 'relative' }}>
                <Image src={src} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Info + config */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ background: 'var(--pink-melo)', color: 'var(--terracotta)', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 999, letterSpacing: '.1em', textTransform: 'uppercase' }}>Osito clásico</span>
            <span style={{ color: 'var(--coral)', fontSize: 14, letterSpacing: 2 }}>★★★★★</span>
            <span style={{ color: 'var(--gray-warm)', fontSize: 13 }}>4.9 · 184 reseñas</span>
          </div>
          <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 44, color: 'var(--navy)', lineHeight: 1.08, letterSpacing: '-.02em', marginBottom: 14 }}>Osito Coral</h1>
          <p style={{ color: 'var(--gray-warm)', fontSize: 16, lineHeight: 1.6, marginBottom: 20 }}>
            Nuestro oseznito más querido, cosido a mano con peluche premium hipoalergénico. Pensado para acompañar los primeros abrazos y guardar recuerdos que duren para siempre.
          </p>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '18px 0', borderTop: '1px dashed rgba(212,132,138,.3)', borderBottom: '1px dashed rgba(212,132,138,.3)', marginBottom: 24 }}>
            <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 38, color: 'var(--terracotta)', lineHeight: 1 }}>{fmt(total)}</div>
            <span style={{ textDecoration: 'line-through', color: 'var(--gray-warm)', fontSize: 18 }}>{fmt(Math.round(total * 1.15))}</span>
            <span style={{ background: 'var(--coral)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, marginLeft: 'auto' }}>−15%</span>
          </div>

          {/* Size */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={configLblStyle}>Tamaño</div>
              <div style={{ fontSize: 14, color: 'var(--terracotta)', fontWeight: 700 }}>{SIZES[activeSize].label} · {SIZES[activeSize].cm}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {SIZES.map((s, i) => (
                <div key={i} onClick={() => setActiveSize(i)} style={{ border: `1.5px solid ${i === activeSize ? 'var(--coral)' : 'rgba(27,42,74,.08)'}`, padding: '14px 10px', borderRadius: 14, background: i === activeSize ? 'var(--pink-melo)' : '#fff', textAlign: 'center', cursor: 'pointer', transition: 'all .2s' }}>
                  <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: i === activeSize ? 'var(--terracotta)' : 'var(--gray-warm)', fontWeight: i === activeSize ? 700 : 400 }}>{s.cm} · {fmt(s.price)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Color */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={configLblStyle}>Color del peluche</div>
              <div style={{ fontSize: 14, color: 'var(--terracotta)', fontWeight: 700 }}>{COLORS[activeColor].name}</div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {COLORS.map((c, i) => (
                <div key={i} onClick={() => setActiveColor(i)} style={{ cursor: 'pointer', transition: 'transform .2s', transform: i === activeColor ? 'translateY(-2px)' : 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: c.hex, border: '3px solid #fff', boxShadow: i === activeColor ? '0 0 0 2.5px var(--coral)' : '0 0 0 1.5px rgba(27,42,74,.1)', transition: 'box-shadow .2s' }} />
                  <span style={{ display: 'block', textAlign: 'center', fontSize: 11, color: i === activeColor ? 'var(--terracotta)' : 'var(--gray-warm)', fontWeight: 600, marginTop: 6 }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div style={{ background: 'var(--cream-peach)', borderRadius: 'var(--radius-md)', padding: 18, marginBottom: 22 }}>
            <div style={configLblStyle}>Toques especiales</div>
            {[
              { id: 'name', label: 'Bordar su nombre', sub: 'Hasta 12 caracteres · letra cursiva', cost: '+$18.000', checked: extraName, set: setExtraName },
              { id: 'box', label: 'Caja de regalo premium', sub: 'Empaque artesanal con moño', cost: '+$15.000', checked: extraBox, set: setExtraBox },
              { id: 'note', label: 'Mensaje escrito a mano', sub: 'Nota personalizada adentro', cost: '+$8.000', checked: extraNote, set: setExtraNote },
            ].map(({ id, label, sub, cost, checked, set }) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px dashed rgba(212,132,138,.25)' }}>
                <input type="checkbox" id={id} checked={checked} onChange={(e) => set(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--coral)' }} />
                <label htmlFor={id} style={{ flex: 1, fontSize: 14, color: 'var(--navy)', fontWeight: 600, cursor: 'pointer' }}>
                  {label}
                  <span style={{ color: 'var(--gray-warm)', fontSize: 12, fontWeight: 500, display: 'block' }}>{sub}</span>
                  {id === 'name' && extraName && (
                    <input value={nameText} onChange={(e) => setNameText(e.target.value)} placeholder="Escribe el nombre aquí..." maxLength={12}
                      style={{ width: '100%', background: '#fff', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 10, padding: '10px 14px', fontFamily: 'inherit', fontSize: 13, color: 'var(--navy)', marginTop: 8 }} />
                  )}
                </label>
                <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--terracotta)', fontSize: 14 }}>{cost}</span>
              </div>
            ))}
          </div>

          {/* Qty + Add */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 12, padding: 4 }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 36, height: 36, borderRadius: 8, color: 'var(--navy)', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>−</button>
              <span style={{ width: 40, textAlign: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: 36, height: 36, borderRadius: 8, color: 'var(--navy)', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
            </div>
            <button onClick={handleAdd} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--coral)', color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 15, boxShadow: '0 8px 22px rgba(212,132,138,.35)', transition: 'all .2s', border: 'none', cursor: 'pointer', padding: '0 24px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
              Agregar · {fmt(total)}
            </button>
          </div>

          {/* Pay info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
            {[
              { icon: 'M2 5h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zM2 10h20', title: 'Abono 50%', sub: `Pagas ${fmt(deposit)} hoy` },
              { icon: 'M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3h18z', title: 'Saldo contraentrega', sub: `Paga ${fmt(total - deposit)} al recibir` },
            ].map(({ icon, title, sub }) => (
              <div key={title} style={{ background: '#fff', border: '1px solid rgba(212,132,138,.2)', borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, background: 'var(--pink-melo)', color: 'var(--coral)', borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={icon} /></svg>
                </div>
                <div>
                  <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{title}</strong>
                  <span style={{ fontSize: 12, color: 'var(--gray-warm)' }}>{sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--gray-warm)', paddingTop: 12, borderTop: '1px dashed rgba(212,132,138,.3)' }}>
            {['Producción 4-6 días', 'Envío a toda Colombia', '100% artesanal'].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="1.8"><path d="M20 6 9 17l-5-5" /></svg>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <section style={{ maxWidth: 1360, margin: '40px auto 0', padding: '0 40px' }}>
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(212,132,138,.2)', marginBottom: 30 }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{ padding: '14px 22px', fontSize: 15, fontWeight: 700, fontFamily: "'Quicksand', sans-serif", color: i === activeTab ? 'var(--coral)' : 'var(--gray-warm)', position: 'relative', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i === activeTab ? '3px solid var(--coral)' : '3px solid transparent', transition: 'color .2s' }}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, marginBottom: 60 }}>
            <div>
              <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 14 }}>El oseznito que ya te está esperando</h3>
              <p style={{ color: 'var(--gray-warm)', fontSize: 15, lineHeight: 1.7, marginBottom: 14 }}>Cada Osito Coral nace en nuestro pequeño taller de Medellín, donde manos cariñosas cortan, cosen y bordan cada detalle. Ningún peluche es idéntico a otro — cada uno lleva un poco del corazón de quien lo hizo.</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Cosido a mano con peluche premium hipoalergénico', 'Relleno siliconado lavable y libre de químicos', 'Ojos y nariz bordados, sin piezas pequeñas — seguro desde los 0 meses', 'Disponible en 4 tamaños y 6 colores principales', 'Producido uno por uno, con amor, en Medellín'].map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--navy)', fontWeight: 500 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 26, boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 16 }}>¿Para qué ocasión?</h4>
              {[['Baby shower', 'Ideal'], ['Cumpleaños infantil', 'Ideal'], ['Aniversario', 'Perfecto'], ['Día de San Valentín', 'Perfecto'], ['Recuerdo de vida', 'Imprescindible']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed rgba(212,132,138,.2)', fontSize: 14 }}>
                  <span style={{ color: 'var(--gray-warm)' }}>{k}</span>
                  <b style={{ color: 'var(--navy)', fontWeight: 700 }}>{v}</b>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 1 && (
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 26, boxShadow: 'var(--shadow-sm)', maxWidth: 600, marginBottom: 60 }}>
            {[['Material exterior', 'Peluche premium 100% poliéster'], ['Relleno', 'Fibra siliconada hipoalergénica'], ['Tamaños', '20cm / 35cm / 50cm / 70cm'], ['Origen', 'Medellín, Colombia'], ['Certificación', 'Libre de BPA y metales pesados'], ['Edad recomendada', 'Desde 0 meses']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed rgba(212,132,138,.2)', fontSize: 14 }}>
                <span style={{ color: 'var(--gray-warm)' }}>{k}</span>
                <b style={{ color: 'var(--navy)', fontWeight: 700 }}>{v}</b>
              </div>
            ))}
          </div>
        )}
        {activeTab === 2 && (
          <div style={{ marginBottom: 60 }}>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 500 }}>
              {['Lavado a mano con agua tibia y jabón suave', 'Evita la secadora — déjalo secar al aire, lejos del sol directo', 'Cepilla suavemente su pelaje cuando se aplaste', 'Guárdalo en un lugar seco y ventilado'].map((f) => (
                <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--navy)', fontWeight: 500 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Toast */}
      {addedToast && (
        <div style={{ position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)', background: '#fff', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-lg)', zIndex: 100, borderLeft: '4px solid #4CAF50' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E8F5E9', color: '#4CAF50', display: 'grid', placeItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <div>
            <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>¡Agregado al carrito!</strong>
            <span style={{ fontSize: 12, color: 'var(--gray-warm)' }}>Osito Coral · {SIZES[activeSize].label} · {COLORS[activeColor].name}</span>
          </div>
          <Link href="/cart" style={{ background: 'var(--coral)', color: '#fff', padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, marginLeft: 8 }}>Ver carrito</Link>
        </div>
      )}
    </main>
  )
}

const configLblStyle: React.CSSProperties = {
  fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14,
  color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '.08em',
}
