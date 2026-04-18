'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

import { api } from '@/lib/services/http'
import { useCartStore } from '@/lib/stores/cartStore'
import type { SaleCreatePayload } from '@/lib/types'

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items])
  const deposit = Math.round(subtotal / 2)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [department, setDepartment] = useState('Antioquia')
  const [payMethod, setPayMethod] = useState('pse')
  const [terms, setTerms] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  function fmt(n: number) { return '$' + n.toLocaleString('es-CO') }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!terms) { setError('Debes aceptar los términos y condiciones.'); return }
    setLoading(true)
    setError('')
    try {
      const payload: SaleCreatePayload = {
        email,
        address,
        city,
        state: department,
        postal_code: '',
        sold_products: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      }
      await api.post('create-sale/', payload)
      clearCart()
      setSuccess(true)
    } catch {
      setError('No pudimos completar el pago. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main style={{ maxWidth: 700, margin: '80px auto', padding: '0 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🧸</div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 40, color: 'var(--navy)', margin: '20px 0 14px' }}>
          ¡Tu pedido está confirmado!
        </h1>
        <p style={{ fontSize: 17, color: 'var(--gray-warm)', lineHeight: 1.6, marginBottom: 32 }}>
          Hemos recibido tu abono del 50%. En las próximas horas recibirás un correo de confirmación y comenzaremos a crear tu peluche con todo el amor del mundo.
        </p>
        <Link href="/tracking" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 999, fontWeight: 700, fontSize: 15, background: 'var(--coral)', color: '#fff', boxShadow: '0 8px 22px rgba(212,132,138,.35)' }}>
          Seguir mi pedido →
        </Link>
      </main>
    )
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
          Completa tus datos y paga el abono del 50% para iniciar la producción. El saldo lo pagas cuando recibes tu peluche.
        </p>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
          {[['Carrito', true, true], ['Envío y pago', true, false], ['Abono inicial', false, false], ['Confirmación', false, false]].map(([label, done, passed], i) => (
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
                <div style={fieldWrap}><label style={fieldLabel}>Tipo de documento</label>
                  <select style={fieldInput}><option>Cédula de ciudadanía</option><option>Cédula de extranjería</option><option>Pasaporte</option></select>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div style={cardStyle}>
              <h3 style={cardHeadStyle}><span style={cardNumStyle}>2</span> Dirección de envío</h3>
              <p style={{ color: 'var(--gray-warm)', fontSize: 14, marginBottom: 20 }}>¿A dónde le llevamos el abrazo?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div style={fieldWrap}><label style={fieldLabel}>País</label><select style={fieldInput}><option>Colombia</option></select></div>
                <div style={fieldWrap}><label style={fieldLabel}>Departamento</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} style={fieldInput}>
                    {['Antioquia', 'Cundinamarca', 'Valle del Cauca', 'Atlántico', 'Bolívar', 'Santander'].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={fieldWrap}><label style={fieldLabel}>Ciudad</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} style={fieldInput}>
                    {['Medellín', 'Bogotá', 'Cali', 'Barranquilla', 'Bucaramanga', 'Cartagena'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                <div style={{ ...fieldWrap, gridColumn: '1/-1' }}><label style={fieldLabel}>Dirección completa</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle 50 # 40-20, Apto 301" style={fieldInput} required /></div>
              </div>
            </div>

            {/* Payment */}
            <div style={cardStyle}>
              <h3 style={cardHeadStyle}><span style={cardNumStyle}>3</span> Método de pago del abono</h3>
              <p style={{ color: 'var(--gray-warm)', fontSize: 14, marginBottom: 20 }}>Recuerda: solo pagas el 50% ahora ({fmt(deposit)})</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { id: 'pse', label: 'PSE', sub: 'Débito bancario' },
                  { id: 'card', label: 'Tarjeta', sub: 'Crédito / Débito' },
                  { id: 'nequi', label: 'Nequi', sub: 'Pago móvil' },
                  { id: 'efecty', label: 'Efecty', sub: 'Pago efectivo' },
                ].map((m) => (
                  <div key={m.id} onClick={() => setPayMethod(m.id)} style={{ background: '#fff', border: `1.5px solid ${payMethod === m.id ? 'var(--coral)' : 'rgba(27,42,74,.08)'}`, borderRadius: 14, padding: '18px 14px', cursor: 'pointer', textAlign: 'center', background: payMethod === m.id ? 'var(--pink-melo)' : '#fff' } as React.CSSProperties}>
                    <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-warm)' }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              {payMethod === 'pse' && (
                <div style={{ background: 'var(--cream-peach)', borderRadius: 12, padding: 18 }}>
                  <p style={{ fontSize: 14, color: 'var(--navy)', marginBottom: 12 }}>Serás redirigido al portal de tu banco para completar el pago de forma segura.</p>
                  <div style={fieldWrap}><label style={fieldLabel}>Banco</label>
                    <select style={fieldInput}><option>Bancolombia</option><option>Banco de Bogotá</option><option>Davivienda</option><option>Nequi (PSE)</option><option>BBVA</option></select>
                  </div>
                </div>
              )}
              {payMethod === 'card' && (
                <div style={{ background: 'var(--cream-peach)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={fieldWrap}><label style={fieldLabel}>Número de tarjeta</label><input placeholder="0000 0000 0000 0000" style={fieldInput} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={fieldWrap}><label style={fieldLabel}>Vencimiento</label><input placeholder="MM / AA" style={fieldInput} /></div>
                    <div style={fieldWrap}><label style={fieldLabel}>CVV</label><input placeholder="•••" style={fieldInput} /></div>
                  </div>
                </div>
              )}
              {payMethod === 'nequi' && (
                <div style={{ background: 'var(--cream-peach)', borderRadius: 12, padding: 18 }}>
                  <p style={{ fontSize: 14, color: 'var(--navy)' }}>Ingresa tu número de celular registrado en Nequi y recibirás una notificación en la app para aprobar el pago.</p>
                  <div style={{ ...fieldWrap, marginTop: 12 }}><label style={fieldLabel}>Número celular Nequi</label><input placeholder="+57 300 000 0000" style={fieldInput} /></div>
                </div>
              )}
              {payMethod === 'efecty' && (
                <div style={{ background: 'var(--cream-peach)', borderRadius: 12, padding: 18 }}>
                  <p style={{ fontSize: 14, color: 'var(--navy)', marginBottom: 8 }}>Sigue estos pasos:</p>
                  {['Confirma tu pedido en este formulario', 'Recibirás un código de pago por correo y WhatsApp', 'Dirígete al punto Efecty más cercano y realiza el pago', 'Envíanos el comprobante por WhatsApp para confirmar'].map((s, i) => (
                    <p key={i} style={{ fontSize: 13, color: 'var(--navy)', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--coral)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      {s}
                    </p>
                  ))}
                </div>
              )}

              {/* Terms */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 16, background: 'var(--cream-peach)', borderRadius: 12, marginTop: 16 }}>
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
              {items.map((item) => {
                const cover = item.gallery_urls?.[0]
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
                    <div style={{ width: 54, height: 54, borderRadius: 10, overflow: 'hidden', background: 'var(--pink-melo)', flexShrink: 0, position: 'relative' }}>
                      {cover && <Image src={cover} alt={item.title} fill className="object-cover" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{item.title}</strong>
                      <span style={{ fontSize: 11, color: 'var(--gray-warm)', display: 'block' }}>× {item.quantity} · {item.description}</span>
                      <b style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--terracotta)', fontSize: 14 }}>${(item.price * item.quantity).toLocaleString('es-CO')}</b>
                    </div>
                  </div>
                )
              })}
              {hydrated && !items.length && <p style={{ color: 'var(--gray-warm)', fontSize: 14 }}>Tu carrito está vacío. <Link href="/catalog">Ver catálogo</Link></p>}
            </div>

            <div style={sumRow}><span>Subtotal</span><b style={{ color: 'var(--navy)' }}>{fmt(subtotal)}</b></div>
            <div style={sumRow}><span>Envío</span><b style={{ color: '#4CAF50' }}>Gratis</b></div>
            <div style={{ height: 1, background: 'rgba(212,132,138,.2)', margin: '10px 0' }} />
            <div style={{ ...sumRow }}><span style={{ color: 'var(--navy)', fontWeight: 700 }}>Total</span><b style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 22, color: 'var(--terracotta)' }}>{fmt(subtotal)}</b></div>

            <div style={{ background: 'var(--cream-peach)', borderRadius: 'var(--radius-md)', padding: 16, margin: '16px 0' }}>
              <div style={sumRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--navy)', fontSize: 13 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 11 }}>1</span>
                  Abono 50% — hoy
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
              {loading ? 'Procesando...' : `Pagar abono · ${fmt(deposit)}`}
              {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
            </button>

            {error && <p style={{ color: '#c23b3b', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{error}</p>}

            <p style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', color: 'var(--gray-warm)', fontSize: 12, marginTop: 12 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M12 2 4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6z" /></svg>
              Pago 100% seguro y encriptado
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
