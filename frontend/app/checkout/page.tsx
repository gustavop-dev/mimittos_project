'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'

import { orderService } from '@/lib/services/orderService'
import { calcDeposit, lineTotal, useCartStore } from '@/lib/stores/cartStore'

const DEPARTMENTS = [
  'Antioquia', 'Cundinamarca', 'Valle del Cauca', 'Atlántico',
  'Bolívar', 'Santander', 'Nariño', 'Córdoba', 'Boyacá', 'Tolima',
]

const CITIES = [
  'Medellín', 'Bogotá', 'Cali', 'Barranquilla', 'Bucaramanga',
  'Cartagena', 'Cúcuta', 'Pereira', 'Manizales', 'Ibagué',
]

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + lineTotal(item), 0), [items])
  const deposit = useMemo(() => calcDeposit(subtotal), [subtotal])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Medellín')
  const [department, setDepartment] = useState('Antioquia')
  const [postalCode, setPostalCode] = useState('')
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setHydrated(true) }, [])

  function fmt(n: number) { return '$' + n.toLocaleString('es-CO') }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!terms) { setError('Debes aceptar los términos y condiciones.'); return }
    if (items.length === 0) { setError('Tu carrito está vacío.'); return }
    setLoading(true)
    setError('')
    try {
      const result = await orderService.createOrder({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        address,
        city,
        department,
        postal_code: postalCode,
        notes,
        items,
      })
      clearCart()
      if (result.checkout_url) {
        router.push(
          `/payment?order=${result.order_number}&deposit=${result.deposit_amount}&url=${encodeURIComponent(result.checkout_url)}`
        )
      } else {
        router.push(`/tracking?order=${result.order_number}`)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'No pudimos completar el pedido. Por favor intenta de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <Link href="/cart" style={{ color: 'var(--gray-warm)' }}>Carrito</Link>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Checkout</b>
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px 30px' }}>
        <div style={eyebrowStyle}>Último paso</div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 46, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
          Un abrazo de distancia ♡
        </h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 16, marginTop: 10, maxWidth: 600, lineHeight: 1.55 }}>
          Completa tus datos y serás redirigido a Wompi para pagar el abono del 50%. El saldo lo pagas cuando recibes tu peluche.
        </p>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
          {[['Carrito', true, true], ['Datos y envío', true, false], ['Pago Wompi', false, false], ['Confirmación', false, false]].map(([label, done, passed], i) => (
            <>
              <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? 'var(--coral)' : '#fff', color: done ? '#fff' : 'var(--gray-warm)', border: done ? 'none' : '1.5px solid rgba(27,42,74,.1)', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14 }}>
                  {passed ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 14, fontWeight: done ? 700 : 500, color: done ? 'var(--navy)' : 'var(--gray-warm)' }}>{label}</span>
              </div>
              {i < 3 && <div key={`s-${i}`} style={{ flex: 1, height: 1.5, background: done ? 'var(--coral)' : 'rgba(27,42,74,.08)', minWidth: 20, maxWidth: 60 }} />}
            </>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 60px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'flex-start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Contact */}
            <div style={cardStyle}>
              <h3 style={cardHeadStyle}><span style={cardNumStyle}>1</span> Contacto</h3>
              <p style={{ color: 'var(--gray-warm)', fontSize: 14, marginBottom: 20 }}>Usaremos estos datos para enviarte notificaciones sobre tu pedido</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={fieldWrap}><label style={fieldLabel}>Nombre completo</label><input value={name} onChange={(e) => setName(e.target.value)} style={fieldInput} required /></div>
                <div style={fieldWrap}><label style={fieldLabel}>Correo electrónico</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={fieldInput} required /></div>
                <div style={fieldWrap}><label style={fieldLabel}>Celular</label><input value={phone} onChange={(e) => setPhone(e.target.value)} style={fieldInput} required /></div>
              </div>
            </div>

            {/* Shipping */}
            <div style={cardStyle}>
              <h3 style={cardHeadStyle}><span style={cardNumStyle}>2</span> Dirección de envío</h3>
              <p style={{ color: 'var(--gray-warm)', fontSize: 14, marginBottom: 20 }}>¿A dónde le llevamos el abrazo?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div style={fieldWrap}>
                  <label style={fieldLabel}>Departamento</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} style={fieldInput}>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={fieldWrap}>
                  <label style={fieldLabel}>Ciudad</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} style={fieldInput}>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={fieldWrap}>
                  <label style={fieldLabel}>Código postal</label>
                  <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="050001" style={fieldInput} />
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={fieldWrap}><label style={fieldLabel}>Dirección completa</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle 50 # 40-20, Apto 301" style={fieldInput} required /></div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={fieldWrap}><label style={fieldLabel}>Notas para el pedido (opcional)</label><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones especiales..." style={fieldInput} /></div>
              </div>
            </div>

            {/* Wompi info */}
            <div style={{ ...cardStyle, background: 'var(--cream-peach)', border: '1px solid rgba(212,132,138,.2)' }}>
              <h3 style={{ ...cardHeadStyle, marginBottom: 12 }}><span style={cardNumStyle}>3</span> Pago con Wompi</h3>
              <p style={{ color: 'var(--navy)', fontSize: 14, lineHeight: 1.6 }}>
                Al confirmar tu pedido, serás redirigido a <strong>Wompi</strong> para pagar el abono del 50% de forma segura. Wompi acepta tarjetas, PSE, Nequi y más.
              </p>
              <p style={{ color: 'var(--gray-warm)', fontSize: 13, marginTop: 10 }}>
                El saldo restante ({fmt(subtotal - deposit)}) lo pagas al recibir tu peluche.
              </p>

              {/* Terms */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 16, background: '#fff', borderRadius: 12, marginTop: 16 }}>
                <input type="checkbox" id="terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ marginTop: 3, accentColor: 'var(--coral)', width: 18, height: 18 }} />
                <label htmlFor="terms" style={{ fontSize: 13, color: 'var(--navy)', lineHeight: 1.5, cursor: 'pointer' }}>
                  He leído y acepto los{' '}
                  <Link href="/terms" style={{ color: 'var(--coral)', fontWeight: 700, textDecoration: 'underline' }}>Términos y Condiciones</Link>
                  {' '}de MIMITTOS, incluyendo la política de abono y contraentrega.
                </label>
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside style={{ position: 'sticky', top: 110, background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 16 }}>Tu pedido</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 260, overflowY: 'auto' }}>
              {items.map((item, idx) => {
                const cover = item.gallery_urls?.[0]
                const itemTotal = lineTotal(item)
                return (
                  <div key={`${item.peluch_id}-${item.size_id}-${item.color_id}-${idx}`} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
                    <div style={{ width: 54, height: 54, borderRadius: 10, overflow: 'hidden', background: item.color_hex || 'var(--pink-melo)', flexShrink: 0, position: 'relative' }}>
                      {cover && <Image src={cover} alt={item.title} fill className="object-cover" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{item.title}</strong>
                      <span style={{ fontSize: 11, color: 'var(--gray-warm)', display: 'block' }}>× {item.quantity} · {item.size_label} · {item.color_name}</span>
                      <b style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--terracotta)', fontSize: 14 }}>{fmt(itemTotal)}</b>
                    </div>
                  </div>
                )
              })}
              {hydrated && !items.length && <p style={{ color: 'var(--gray-warm)', fontSize: 14 }}>Tu carrito está vacío. <Link href="/catalog">Ver catálogo</Link></p>}
            </div>

            <div style={sumRow}><span>Subtotal</span><b style={{ color: 'var(--navy)' }}>{fmt(subtotal)}</b></div>
            <div style={sumRow}><span>Envío</span><b style={{ color: '#4CAF50' }}>Gratis</b></div>
            <div style={{ height: 1, background: 'rgba(212,132,138,.2)', margin: '10px 0' }} />
            <div style={sumRow}><span style={{ color: 'var(--navy)', fontWeight: 700 }}>Total</span><b style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 22, color: 'var(--terracotta)' }}>{fmt(subtotal)}</b></div>

            <div style={{ background: 'var(--cream-peach)', borderRadius: 'var(--radius-md)', padding: 16, margin: '16px 0' }}>
              <div style={sumRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--navy)', fontSize: 13 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 11 }}>1</span>
                  Abono 50% — hoy (Wompi)
                </div>
                <b style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--terracotta)' }}>{fmt(deposit)}</b>
              </div>
              <div style={sumRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--navy)', fontSize: 13 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--gray-warm)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 11 }}>2</span>
                  Saldo — contraentrega
                </div>
                <b style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--gray-warm)' }}>{fmt(subtotal - deposit)}</b>
              </div>
            </div>

            <button type="submit" disabled={loading || !hydrated || !items.length || !terms} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--coral)', color: '#fff', width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, fontFamily: "'Quicksand', sans-serif", boxShadow: '0 10px 26px rgba(212,132,138,.4)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, transition: 'all .2s' }}>
              {loading ? 'Procesando...' : `Ir a pagar · ${fmt(deposit)}`}
              {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
            </button>

            {error && <p style={{ color: '#c23b3b', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{error}</p>}

            <p style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', color: 'var(--gray-warm)', fontSize: 12, marginTop: 12 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M12 2 4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6z" /></svg>
              Pago 100% seguro con Wompi
            </p>
          </aside>
        </div>
      </form>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = { color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8 }
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }
const cardHeadStyle: React.CSSProperties = { fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }
const cardNumStyle: React.CSSProperties = { width: 28, height: 28, borderRadius: '50%', background: 'var(--coral)', color: '#fff', fontSize: 13, display: 'grid', placeItems: 'center' }
const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--navy)', letterSpacing: '.04em', textTransform: 'uppercase' }
const fieldInput: React.CSSProperties = { background: 'var(--cream-warm)', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 12, padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, color: 'var(--navy)', outline: 'none', width: '100%' }
const sumRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: 'var(--gray-warm)' }
