'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { paymentService } from '@/lib/services/paymentService'

function OrderConfirmedContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') ?? ''
  const isGuest = searchParams.get('guest') === '1'
  const customerEmail = searchParams.get('email') ?? ''
  const startConfirmed = searchParams.get('confirmed') === '1'

  const [confirmed, setConfirmed] = useState(startConfirmed)

  // Retry checks with increasing delays — handles sandbox PENDING lag and 3DS returns.
  // Attempts at ~2s, 7s, 17s, 37s from mount. Stops as soon as approved.
  useEffect(() => {
    if (confirmed || !orderNumber) return

    const DELAYS = [2000, 5000, 10000, 20000]
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function tryCheck(idx: number) {
      if (cancelled || idx >= DELAYS.length) return
      timer = setTimeout(async () => {
        if (cancelled) return
        try {
          const data = await paymentService.checkStatus(orderNumber)
          if (data.status === 'approved') {
            setConfirmed(true)
          } else {
            tryCheck(idx + 1)
          }
        } catch {
          tryCheck(idx + 1)
        }
      }, DELAYS[idx])
    }

    tryCheck(0)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [confirmed, orderNumber])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: confirmed ? '#E8F5E9' : 'var(--cream-peach)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {confirmed ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 30, color: 'var(--navy)', margin: '0 0 10px', lineHeight: 1.2 }}>
            {confirmed ? '¡Pedido confirmado!' : '¡Gracias por tu pedido!'}
          </h1>
          {orderNumber && (
            <div style={{ display: 'inline-block', background: 'var(--pink-melo)', borderRadius: 999, padding: '6px 16px', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--terracotta)', marginBottom: 12 }}>
              {orderNumber}
            </div>
          )}
          <p style={{ color: 'var(--gray-warm)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            {confirmed
              ? 'Tu abono fue procesado exitosamente. Comenzaremos a producir tu peluche muy pronto.'
              : 'Tu pedido fue registrado. Cuando Wompi confirme el pago te enviaremos un correo y comenzamos producción.'}
          </p>
        </div>

        {/* Payment status */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(27,42,74,.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: confirmed ? '#E8F5E9' : '#FFF8E1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            {confirmed ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F57F17" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            )}
          </div>
          <div>
            <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: confirmed ? '#2E7D32' : '#F57F17' }}>
              {confirmed ? 'Pago confirmado' : 'Pago en proceso'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-warm)', lineHeight: 1.4 }}>
              {confirmed
                ? 'El abono del 50% fue acreditado.'
                : 'Wompi nos notificará cuando acrediten el pago. No necesitas esperar aquí.'}
            </div>
          </div>
        </div>

        {/* Email info */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(27,42,74,.07)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--cream-peach)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 3 }}>Revisa tu correo</div>
            <div style={{ fontSize: 13, color: 'var(--gray-warm)', lineHeight: 1.5 }}>
              Te enviamos un resumen del pedido con todos los detalles.
            </div>
          </div>
        </div>

        {/* Guest register banner */}
        {isGuest && (
          <div style={{ background: '#EDE7F6', border: '1px solid #B39DDB', borderRadius: 16, padding: '18px 20px', marginBottom: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#B39DDB', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4527A0" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: '#4527A0', fontSize: 15, marginBottom: 3 }}>
                ¡Crea tu cuenta y ve tus pedidos!
              </div>
              <div style={{ fontSize: 13, color: '#512DA8', lineHeight: 1.5, marginBottom: 10 }}>
                Regístrate con{customerEmail ? <> el correo <strong>{customerEmail}</strong></> : ' el correo que usaste para comprar'} y este pedido aparecerá automáticamente en tu perfil.
              </div>
              <Link
                href={`/sign-up${customerEmail ? `?email=${encodeURIComponent(customerEmail)}` : ''}`}
                style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 999, background: '#512DA8', color: '#fff', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
              >
                Crear cuenta →
              </Link>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Link href={`/tracking?order=${orderNumber}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, background: 'var(--coral)', color: '#fff', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 24px rgba(212,132,138,.35)' }}>
            Ver estado del pedido
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
          <Link href="/"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 20px', borderRadius: 14, background: '#fff', color: 'var(--navy)', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 12px rgba(27,42,74,.08)' }}>
            Seguir comprando
          </Link>
        </div>

      </div>
    </main>
  )
}

export default function OrderConfirmedPage() {
  return (
    <Suspense>
      <OrderConfirmedContent />
    </Suspense>
  )
}
