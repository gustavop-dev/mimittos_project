'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { paymentService } from '@/lib/services/paymentService'

function OrderConfirmedContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') ?? ''
  const isNew = searchParams.get('new') === '1'
  const startConfirmed = searchParams.get('confirmed') === '1'

  const [confirmed, setConfirmed] = useState(startConfirmed)

  // Single check 2 s after mount — handles sandbox PENDING and 3DS returns.
  // In production, direct card charges resolve synchronously (APPROVED/DECLINED)
  // so this fires at most once and only matters for PENDING edge cases.
  useEffect(() => {
    if (confirmed || !orderNumber) return
    const t = setTimeout(async () => {
      try {
        const data = await paymentService.pollStatus(orderNumber)
        if (data.status === 'approved') setConfirmed(true)
      } catch {}
    }, 2000)
    return () => clearTimeout(t)
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
              Te enviamos un resumen del pedido.
              {isNew && ' También encontrarás tus credenciales para acceder a tu cuenta.'}
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
                Puedes iniciar sesión para ver el historial de tus pedidos en cualquier momento.
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
