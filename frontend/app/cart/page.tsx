'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useMemo } from 'react'

import { useCartStore } from '@/lib/stores/cartStore'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const removeFromCart = useCartStore((s) => s.removeFromCart)
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items])
  const deposit = Math.round(subtotal / 2)

  function fmt(n: number) { return '$' + n.toLocaleString('es-CO') }

  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Carrito de compra</b>
      </div>

      {/* Page title */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px 30px' }}>
        <div style={eyebrowStyle}>Tu carrito</div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 46, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
          Ya casi los tienes en tus brazos 🧸
        </h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 16, marginTop: 10, maxWidth: 600, lineHeight: 1.55 }}>
          Revisa los peluches que están esperándote. Puedes ajustar cantidades o eliminar ítems antes de pasar al pago.
        </p>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30, flexWrap: 'wrap' }}>
          {['Carrito', 'Envío', 'Pago del abono', 'Confirmación'].map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? 'var(--coral)' : '#fff', color: i === 0 ? '#fff' : 'var(--gray-warm)', border: i === 0 ? 'none' : '1.5px solid rgba(27,42,74,.1)', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14 }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 14, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--navy)' : 'var(--gray-warm)' }}>{s}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1.5, background: 'rgba(27,42,74,.08)', minWidth: 20, maxWidth: 60 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 60px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'flex-start' }}>
        {/* Cart list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 48 }}>🧸</div>
              <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--navy)', margin: '14px 0 10px' }}>Tu carrito está vacío</h3>
              <p style={{ color: 'var(--gray-warm)', fontSize: 14, marginBottom: 20 }}>Descubre nuestros peluches y empieza a crear recuerdos</p>
              <Link href="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15, background: 'var(--coral)', color: '#fff', boxShadow: '0 8px 22px rgba(212,132,138,.35)' }}>
                Ver catálogo
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const cover = item.gallery_urls?.[0]
              return (
                <div key={item.id} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 20, display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 20, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: 120, height: 120, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--pink-melo)', position: 'relative' }}>
                    {cover && <Image src={cover} alt={item.title} fill className="object-cover" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--coral)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>{item.category}</div>
                    <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 10 }}>{item.title}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--pink-melo)', color: 'var(--terracotta)', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999 }}>
                        {item.description}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 13, color: 'var(--gray-warm)', marginTop: 14 }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ color: '#c23b3b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--cream-warm)', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 12, padding: 4 }}>
                      <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--navy)', fontSize: 16, fontWeight: 700, display: 'grid', placeItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>−</button>
                      <span style={{ width: 34, textAlign: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--navy)', fontSize: 16, fontWeight: 700, display: 'grid', placeItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--gray-warm)' }}>{fmt(item.price)} c/u</div>
                      <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--terracotta)' }}>{fmt(item.price * item.quantity)}</div>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {items.length > 0 && (
            <Link href="/catalog" style={{ background: 'linear-gradient(135deg,var(--cream-peach),var(--pink-melo))', borderRadius: 'var(--radius-lg)', padding: 22, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 2 }}>¿Sigues buscando?</strong>
                <span style={{ fontSize: 13, color: 'var(--gray-warm)' }}>Descubre más peluches que podrían hacerte sonreír</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 999, fontWeight: 600, fontSize: 14, background: 'var(--coral)', color: '#fff' }}>
                Seguir explorando
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
            </Link>
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <aside style={{ position: 'sticky', top: 110, background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--navy)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Resumen del pedido
              <span style={{ fontSize: 13, color: 'var(--gray-warm)', fontWeight: 500 }}>{items.reduce((a, i) => a + i.quantity, 0)} peluches</span>
            </h3>

            <div style={sumRowStyle}><span>Subtotal</span><b style={{ color: 'var(--navy)' }}>{fmt(subtotal)}</b></div>
            <div style={sumRowStyle}><span>Envío</span><b style={{ color: '#4CAF50' }}>Gratis sobre $300.000</b></div>
            <div style={{ height: 1, background: 'rgba(212,132,138,.2)', margin: '12px 0' }} />
            <div style={{ ...sumRowStyle, paddingTop: 16 }}>
              <span style={{ fontSize: 15, color: 'var(--navy)', fontWeight: 700 }}>Total del pedido</span>
              <b style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 24, color: 'var(--terracotta)' }}>{fmt(subtotal)}</b>
            </div>

            <div style={{ background: 'var(--cream-peach)', borderRadius: 'var(--radius-md)', padding: 18, margin: '18px 0' }}>
              <h4 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>Cómo se divide tu pago</h4>
              <div style={sumRowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--navy)', fontWeight: 600, fontSize: 13 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 11 }}>1</span>
                  Abono 50% <span style={{ fontSize: 11, color: 'var(--gray-warm)', fontWeight: 500 }}>— pagas hoy</span>
                </div>
                <b style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--terracotta)' }}>{fmt(deposit)}</b>
              </div>
              <div style={sumRowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--navy)', fontWeight: 600, fontSize: 13 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--gray-warm)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 11 }}>2</span>
                  Saldo 50% <span style={{ fontSize: 11, color: 'var(--gray-warm)', fontWeight: 500 }}>— al recibir</span>
                </div>
                <b style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--gray-warm)' }}>{fmt(subtotal - deposit)}</b>
              </div>
            </div>

            <Link href="/checkout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--coral)', color: '#fff', width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 16, fontFamily: "'Quicksand', sans-serif", boxShadow: '0 10px 26px rgba(212,132,138,.4)', textDecoration: 'none' }}>
              Ir a pagar abono · {fmt(deposit)}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link href="/catalog" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 12, padding: 14, borderRadius: 14, color: 'var(--navy)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              Seguir comprando
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
              {[['Pago seguro', 'Datos encriptados'], ['Producción', '4-6 días hábiles'], ['Envío nacional', '2-5 días'], ['Hecho a mano', 'Con mucho cariño']].map(([title, sub]) => (
                <div key={title} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--gray-warm)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2 4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6z" /></svg>
                  <div><b style={{ color: 'var(--navy)', display: 'block', fontWeight: 700, fontSize: 13 }}>{title}</b>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px dashed rgba(212,132,138,.2)' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-warm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Métodos de pago aceptados</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['PSE', 'Nequi', 'VISA', 'MasterCard', 'Efecty'].map((m) => (
                  <span key={m} style={{ background: 'var(--cream-peach)', color: 'var(--navy)', fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 8 }}>{m}</span>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif",
  fontWeight: 600, fontSize: 13, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
}

const sumRowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  padding: '10px 0', fontSize: 14, color: 'var(--gray-warm)',
}
