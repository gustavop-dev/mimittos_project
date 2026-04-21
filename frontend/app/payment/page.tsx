'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

type Method = 'card' | 'nequi' | 'bancolombia' | 'pse'

const METHODS: {
  id: Method
  name: string
  desc: string
  logo: string
  logoSize: { w: number; h: number }
  bg: string
  border: string
  logoBg: string
}[] = [
  {
    id: 'card',
    name: 'Tarjeta',
    desc: 'Crédito o débito',
    logo: '/mimittos/payments/card.svg',
    logoSize: { w: 48, h: 48 },
    bg: '#F8F4FF',
    border: '#C9B8F5',
    logoBg: 'var(--navy)',
  },
  {
    id: 'nequi',
    name: 'Nequi',
    desc: 'Paga desde tu app',
    logo: '/mimittos/payments/nequi.jpeg',
    logoSize: { w: 72, h: 36 },
    bg: '#FDF0FF',
    border: '#E0AAFF',
    logoBg: 'transparent',
  },
  {
    id: 'bancolombia',
    name: 'Bancolombia',
    desc: 'Botón Bancolombia',
    logo: '/mimittos/payments/bancolombia.png',
    logoSize: { w: 56, h: 56 },
    bg: '#FFFDE7',
    border: '#FFD54F',
    logoBg: 'transparent',
  },
  {
    id: 'pse',
    name: 'PSE',
    desc: 'Débito bancario',
    logo: '/mimittos/payments/pse.png',
    logoSize: { w: 64, h: 64 },
    bg: '#E8F4FD',
    border: '#64B5F6',
    logoBg: 'transparent',
  },
]

function PaymentContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') ?? ''
  const wompiUrl = searchParams.get('url') ?? ''
  const depositRaw = searchParams.get('deposit') ?? '0'
  const deposit = parseInt(depositRaw, 10) || 0

  const [selected, setSelected] = useState<Method | null>(null)

  function fmt(n: number) {
    return '$' + n.toLocaleString('es-CO')
  }

  function handlePay() {
    if (!wompiUrl) return
    window.location.href = wompiUrl
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream-warm)' }}>
      {/* Header strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(27,42,74,.07)', padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/mimittos/logo-dark-small.png" alt="MIMITTOS" width={32} height={32} />
          <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--navy)', letterSpacing: '-.01em' }}>MIMITTOS</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-warm)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M12 2 4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6z" /></svg>
          Pago seguro · Procesado por Wompi
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center' }}>
          {[['Carrito', true, true], ['Datos', true, true], ['Pago', true, false], ['Listo', false, false]].map(([label, done, past], i) => (
            <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: done ? 'var(--coral)' : '#fff',
                  color: done ? '#fff' : 'var(--gray-warm)',
                  border: done ? 'none' : '1.5px solid rgba(27,42,74,.12)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 12,
                }}>
                  {past ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: done ? 700 : 500, color: done ? 'var(--navy)' : 'var(--gray-warm)' }}>{label}</span>
              </div>
              {i < 3 && <div style={{ width: 28, height: 1.5, background: done ? 'var(--coral)' : 'rgba(27,42,74,.1)' }} />}
            </div>
          ))}
        </div>

        {/* Order info */}
        {orderNumber && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 12px rgba(27,42,74,.06)' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 2 }}>Pedido</div>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>{orderNumber}</div>
            </div>
            {deposit > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--gray-warm)', marginBottom: 2 }}>Abono (50%) — hoy</div>
                <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, color: 'var(--terracotta)', fontSize: 22 }}>{fmt(deposit)}</div>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            Paso 3 de 4
          </div>
          <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 30, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.15, margin: 0 }}>
            ¿Cómo quieres pagar?
          </h1>
          <p style={{ color: 'var(--gray-warm)', fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Elige tu método de pago preferido y serás llevado a completar el proceso de forma segura.
          </p>
        </div>

        {/* Payment method grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          {METHODS.map((m) => {
            const isSelected = selected === m.id
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                style={{
                  background: isSelected ? m.bg : '#fff',
                  border: `2px solid ${isSelected ? 'var(--coral)' : 'rgba(27,42,74,.08)'}`,
                  borderRadius: 18,
                  padding: '22px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: isSelected
                    ? '0 6px 24px rgba(212,132,138,.22)'
                    : '0 2px 8px rgba(27,42,74,.05)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all .18s ease',
                  position: 'relative',
                  outline: 'none',
                }}
              >
                {/* Selected check */}
                {isSelected && (
                  <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: 'var(--coral)', display: 'grid', placeItems: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}

                {/* Logo container */}
                <div style={{
                  width: 72, height: 72, borderRadius: 16,
                  background: m.id === 'card' ? 'var(--navy)' : '#f5f5f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  padding: m.id === 'card' ? 14 : 0,
                }}>
                  {m.id === 'card' ? (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                      <line x1="6" y1="15" x2="10" y2="15" />
                    </svg>
                  ) : (
                    <Image
                      src={m.logo}
                      alt={m.name}
                      width={m.logoSize.w}
                      height={m.logoSize.h}
                      style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                    />
                  )}
                </div>

                {/* Name and description */}
                <div>
                  <div style={{
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    color: isSelected ? 'var(--coral)' : 'var(--navy)',
                    marginBottom: 3,
                  }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-warm)', lineHeight: 1.4 }}>
                    {m.desc}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={!selected || !wompiUrl}
          style={{
            width: '100%',
            padding: '17px 20px',
            borderRadius: 16,
            background: selected ? 'var(--coral)' : 'rgba(27,42,74,.1)',
            color: selected ? '#fff' : 'var(--gray-warm)',
            fontFamily: "'Quicksand', sans-serif",
            fontWeight: 800,
            fontSize: 17,
            border: 'none',
            cursor: selected ? 'pointer' : 'not-allowed',
            boxShadow: selected ? '0 10px 28px rgba(212,132,138,.38)' : 'none',
            transition: 'all .2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {selected
            ? <>
                Pagar{deposit > 0 ? ` · ${fmt(deposit)}` : ''}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </>
            : 'Selecciona un método de pago'
          }
        </button>

        {/* Security note */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff', borderRadius: 14, padding: '14px 18px', marginTop: 18, boxShadow: '0 2px 8px rgba(27,42,74,.05)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2 4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6z" /></svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>Pago 100% seguro</div>
            <div style={{ fontSize: 12, color: 'var(--gray-warm)', lineHeight: 1.5 }}>
              Tu información de pago es procesada de forma segura por <strong>Wompi</strong>, certificada por PCI DSS. MIMITTOS nunca almacena datos de tu tarjeta.
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/checkout" style={{ fontSize: 13, color: 'var(--gray-warm)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            Volver a revisar mis datos
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  )
}
