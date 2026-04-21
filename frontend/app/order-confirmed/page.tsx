'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import { paymentService } from '@/lib/services/paymentService'

function OrderConfirmedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') ?? ''
  const isNew = searchParams.get('new') === '1'
  const startConfirmed = searchParams.get('confirmed') === '1'

  const [paymentConfirmed, setPaymentConfirmed] = useState(startConfirmed)
  const [polling, setPolling] = useState(!startConfirmed)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (startConfirmed || !orderNumber) return

    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > 24) {
        clearInterval(pollRef.current!)
        setPolling(false)
        return
      }
      try {
        const data = await paymentService.pollStatus(orderNumber)
        if (data.status === 'approved') {
          clearInterval(pollRef.current!)
          setPaymentConfirmed(true)
          setPolling(false)
        } else if (data.status === 'declined' || data.status === 'error') {
          clearInterval(pollRef.current!)
          setPolling(false)
          router.replace(`/payment?order=${orderNumber}`)
        }
      } catch {}
    }, 5000)

    return () => { if (pollRef.current) clearInterval(pollRef.current!) }
  }, [orderNumber, startConfirmed, router])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {paymentConfirmed ? (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#E8F5E9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--cream-peach)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 30, color: 'var(--navy)', margin: '0 0 10px', lineHeight: 1.2 }}>
            {paymentConfirmed ? '¡Pedido confirmado!' : '¡Gracias por tu pedido!'}
          </h1>
          {orderNumber && (
            <div style={{ display: 'inline-block', background: 'var(--pink-melo)', borderRadius: 999, padding: '6px 16px', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--terracotta)', marginBottom: 12 }}>
              {orderNumber}
            </div>
          )}
          <p style={{ color: 'var(--gray-warm)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            {paymentConfirmed
              ? 'Tu abono fue procesado exitosamente. Comenzaremos a producir tu peluche muy pronto.'
              : 'Tu pedido fue registrado. Estamos verificando el pago — esto puede tardar unos segundos.'}
          </p>
        </div>

        {/* Payment status card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(27,42,74,.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
          {paymentConfirmed ? (
            <>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#E8F5E9', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: '#2E7D32', fontSize: 15 }}>Pago confirmado</div>
                <div style={{ fontSize: 13, color: 'var(--gray-warm)' }}>El abono del 50% fue acreditado correctamente.</div>
              </div>
            </>
          ) : polling ? (
            <>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#FFF8E1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F57F17" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: '#F57F17', fontSize: 15 }}>Verificando pago…</div>
                <div style={{ fontSize: 13, color: 'var(--gray-warm)' }}>Estamos esperando confirmación. No cierres esta página.</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--coral)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#FFF8E1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F57F17" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: '#F57F17', fontSize: 15 }}>Pago en proceso</div>
                <div style={{ fontSize: 13, color: 'var(--gray-warm)' }}>Te notificaremos por correo cuando se confirme.</div>
              </div>
            </>
          )}
        </div>

        {/* Email info */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(27,42,74,.07)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--cream-peach)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 3 }}>Revisa tu correo</div>
            <div style={{ fontSize: 13, color: 'var(--gray-warm)', lineHeight: 1.5 }}>
              Te enviamos un resumen del pedido.
              {isNew && ' También encontrarás tus credenciales de acceso para ver el historial de tus compras.'}
            </div>
          </div>
        </div>

        {/* New account banner */}
        {isNew && (
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 16, padding: '18px 20px', marginBottom: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#A5D6A7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: '#1B5E20', fontSize: 15, marginBottom: 3 }}>Tu cuenta fue creada</div>
              <div style={{ fontSize: 13, color: '#2E7D32', lineHeight: 1.5, marginBottom: 10 }}>
                Creamos una cuenta para que puedas ver el estado de tus pedidos en cualquier momento.
              </div>
              <Link href="/auth/login" style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 999, background: '#2E7D32', color: '#fff', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                Iniciar sesión →
              </Link>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Link href={`/tracking?order=${orderNumber}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, background: 'var(--coral)', color: '#fff', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 24px rgba(212,132,138,.35)' }}>
            Ver mi pedido
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
          <Link href="/"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 20px', borderRadius: 14, background: '#fff', color: 'var(--navy)', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 12px rgba(27,42,74,.08)' }}>
            Seguir comprando
          </Link>
        </div>

      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(1)}40%{transform:scale(1.4)} }`}</style>
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
