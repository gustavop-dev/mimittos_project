'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { orderService } from '@/lib/services/orderService'
import type { OrderStatus, OrderTrackingInfo } from '@/lib/types'

const TIMELINE_STEPS: { label: string; desc: string; statuses: OrderStatus[] }[] = [
  { label: 'Pedido recibido', desc: 'Confirmamos tu pedido y el abono.', statuses: ['pending_payment', 'payment_confirmed', 'in_production', 'shipped', 'delivered'] },
  { label: 'Pago confirmado', desc: 'El abono fue procesado exitosamente.', statuses: ['payment_confirmed', 'in_production', 'shipped', 'delivered'] },
  { label: 'En producción', desc: 'Tu peluche está siendo cosido a mano.', statuses: ['in_production', 'shipped', 'delivered'] },
  { label: 'Listo para envío', desc: 'Empacado con amor y esperando al mensajero.', statuses: ['shipped', 'delivered'] },
  { label: 'En camino', desc: 'Tu peluche está en ruta hacia ti.', statuses: ['shipped', 'delivered'] },
  { label: '¡Entregado!', desc: '¡Ya llegó a tus brazos!', statuses: ['delivered'] },
]

function stepDone(step: typeof TIMELINE_STEPS[0], status: OrderStatus) {
  return step.statuses.includes(status)
}

function currentStepCount(status: OrderStatus) {
  return TIMELINE_STEPS.filter((s) => stepDone(s, status)).length
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function TrackingContent() {
  const searchParams = useSearchParams()
  const [orderNum, setOrderNum] = useState(searchParams.get('order') ?? '')
  const [tracking, setTracking] = useState<OrderTrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-search when arriving from Wompi redirect
  useEffect(() => {
    const orderFromUrl = searchParams.get('order')
    if (orderFromUrl) {
      handleSearch(orderFromUrl)
    }
  }, [])

  async function handleSearch(num?: string) {
    const query = (num ?? orderNum).trim()
    if (!query) return
    setLoading(true)
    setError('')
    setTracking(null)
    try {
      const data = await orderService.trackOrder(query)
      setTracking(data)
    } catch {
      setError('No encontramos ningún pedido con ese número.')
    } finally {
      setLoading(false)
    }
  }

  const doneCount = tracking ? currentStepCount(tracking.status) : 0

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 80px', display: 'grid', gridTemplateColumns: tracking ? '1fr 1fr' : '1fr', gap: 50 }}>
      {/* Search + timeline */}
      <div>
        {/* Search */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 16 }}>Número de pedido</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ej: PELUCH-20260420-XXXX"
              style={{ flex: 1, background: 'var(--cream-warm)', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 12, padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, color: 'var(--navy)', outline: 'none' }}
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              style={{ padding: '12px 22px', borderRadius: 12, background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? .7 : 1 }}
            >
              {loading ? '...' : 'Buscar'}
            </button>
          </div>
          {error && <p style={{ color: '#c23b3b', fontSize: 13, marginTop: 10 }}>{error}</p>}
          <p style={{ fontSize: 12, color: 'var(--gray-warm)', marginTop: 10 }}>
            Puedes encontrar tu número de pedido en el correo de confirmación.
          </p>
        </div>

        {/* Payment status banner */}
        {tracking && (tracking.payment_status === 'DECLINED' || tracking.payment_status === 'ERROR') && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFCDD2', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#C62828' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: '#C62828', fontSize: 15, marginBottom: 4 }}>
                {tracking.payment_status === 'DECLINED' ? 'Pago rechazado' : 'Error en el pago'}
              </strong>
              <p style={{ fontSize: 13, color: '#B71C1C', margin: 0 }}>
                {tracking.payment_status === 'DECLINED'
                  ? 'Tu método de pago fue rechazado. Intenta con otro método o contacta a tu banco.'
                  : 'Ocurrió un error al procesar tu pago. Por favor intenta de nuevo.'}
              </p>
              {tracking.checkout_url && (
                <a href={tracking.checkout_url} style={{ display: 'inline-block', marginTop: 10, padding: '8px 18px', borderRadius: 999, background: '#C62828', color: '#fff', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  Intentar de nuevo
                </a>
              )}
            </div>
          </div>
        )}

        {tracking && tracking.payment_status === 'PENDING' && tracking.status === 'pending_payment' && (
          <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFE082', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#F57F17' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: '#F57F17', fontSize: 15, marginBottom: 4 }}>Pago pendiente</strong>
              <p style={{ fontSize: 13, color: '#E65100', margin: 0 }}>Tu pago aún no ha sido confirmado.</p>
              {tracking.checkout_url && (
                <a href={tracking.checkout_url} style={{ display: 'inline-block', marginTop: 10, padding: '8px 18px', borderRadius: 999, background: '#F57F17', color: '#fff', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  Ir a pagar
                </a>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {tracking && (
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--coral)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Pedido encontrado</div>
                <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--navy)' }}>{tracking.order_number}</h3>
              </div>
              <span style={{ background: 'var(--pink-melo)', color: 'var(--terracotta)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {tracking.status.replace(/_/g, ' ')}
              </span>
            </div>

            {tracking.status === 'cancelled' ? (
              <div style={{ padding: 20, background: '#FFEBEE', borderRadius: 12, color: '#C62828', fontWeight: 600 }}>
                Este pedido fue cancelado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {TIMELINE_STEPS.map((step, i) => {
                  const done = stepDone(step, tracking.status)
                  return (
                    <div key={step.label} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, background: done ? 'var(--coral)' : 'rgba(27,42,74,.08)', zIndex: 0 }} />
                      )}
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: done ? 'var(--coral)' : '#fff', border: done ? 'none' : '2px solid rgba(27,42,74,.1)', color: done ? '#fff' : 'var(--gray-warm)', display: 'grid', placeItems: 'center', flexShrink: 0, zIndex: 1, fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13 }}>
                        {done ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                        ) : i + 1}
                      </div>
                      <div style={{ paddingBottom: i < TIMELINE_STEPS.length - 1 ? 28 : 0 }}>
                        <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: done ? 'var(--navy)' : 'var(--gray-warm)' }}>{step.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--gray-warm)', marginTop: 2 }}>{step.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details panel */}
      {tracking && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Progress bar */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 16 }}>Progreso general</h3>
            <div style={{ height: 12, background: 'var(--pink-melo)', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${(doneCount / TIMELINE_STEPS.length) * 100}%`, background: 'linear-gradient(90deg,var(--coral),var(--coral-soft))', borderRadius: 999, transition: 'width .5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-warm)', fontWeight: 600 }}>
              <span>Paso {doneCount} de {TIMELINE_STEPS.length}</span>
              <b style={{ color: 'var(--terracotta)' }}>{Math.round((doneCount / TIMELINE_STEPS.length) * 100)}% completado</b>
            </div>
          </div>

          {/* Order info */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 20 }}>Detalle del pedido</h3>
            {[
              ['Número de pedido', tracking.order_number],
              ['Fecha del pedido', fmtDate(tracking.created_at)],
              ['Última actualización', fmtDate(tracking.updated_at)],
              ...(tracking.tracking_number ? [
                ['Guía de envío', tracking.tracking_number],
                ['Transportadora', tracking.shipping_carrier],
              ] : [['Guía de envío', 'La guía estará disponible pronto']]),
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed rgba(212,132,138,.2)', fontSize: 14 }}>
                <span style={{ color: 'var(--gray-warm)' }}>{k}</span>
                <b style={{ color: 'var(--navy)', fontWeight: 600, textAlign: 'right', maxWidth: 220 }}>{v}</b>
              </div>
            ))}
          </div>

          {/* Help */}
          <div style={{ background: 'linear-gradient(135deg,var(--cream-peach),var(--pink-melo))', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>¿Tienes alguna pregunta sobre tu pedido?</strong>
            <p style={{ fontSize: 14, color: 'var(--gray-warm)', lineHeight: 1.6, marginBottom: 14 }}>
              Escríbenos directamente por WhatsApp y te respondemos en minutos.
            </p>
            <a href="https://wa.me/573000000000" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14, background: '#25D366', color: '#fff' }}>
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrackingPage() {
  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Seguimiento de pedido</b>
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px 30px' }}>
        <div style={eyebrowStyle}>Seguimiento</div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 46, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
          ¿Dónde está tu peluche?
        </h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 16, marginTop: 10, maxWidth: 560, lineHeight: 1.55 }}>
          Ingresa tu número de pedido y te mostramos en tiempo real cómo va la producción y el envío.
        </p>
      </div>

      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-warm)' }}>Cargando...</div>}>
        <TrackingContent />
      </Suspense>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif",
  fontWeight: 600, fontSize: 13, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
}
