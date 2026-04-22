'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { paymentService, type AcceptanceTokens, type PaymentInfo, type PseBank } from '@/lib/services/paymentService'

type Method = 'CARD' | 'NEQUI' | 'PSE' | 'BANCOLOMBIA_TRANSFER'

const METHODS: {
  id: Method
  name: string
  desc: string
  bg: string
  border: string
  logo: React.ReactNode
}[] = [
  {
    id: 'CARD',
    name: 'Tarjeta',
    desc: 'Crédito o débito',
    bg: '#F8F4FF',
    border: '#C9B8F5',
    logo: (
      <div style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /><line x1="6" y1="15" x2="10" y2="15" />
        </svg>
      </div>
    ),
  },
  {
    id: 'NEQUI',
    name: 'Nequi',
    desc: 'Paga desde tu app',
    bg: '#FDF0FF',
    border: '#E0AAFF',
    logo: (
      <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', background: '#f5f5f5' }}>
        <Image src="/mimittos/payments/nequi.jpeg" alt="Nequi" width={72} height={72} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
      </div>
    ),
  },
  {
    id: 'PSE',
    name: 'PSE',
    desc: 'Débito bancario',
    bg: '#E8F4FD',
    border: '#64B5F6',
    logo: (
      <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Image src="/mimittos/payments/pse.png" alt="PSE" width={56} height={56} style={{ objectFit: 'contain' }} />
      </div>
    ),
  },
  {
    id: 'BANCOLOMBIA_TRANSFER',
    name: 'Bancolombia',
    desc: 'Botón Bancolombia',
    bg: '#FFFDE7',
    border: '#FFD54F',
    logo: (
      <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Image src="/mimittos/payments/bancolombia.png" alt="Bancolombia" width={56} height={56} style={{ objectFit: 'contain' }} />
      </div>
    ),
  },
]

const ID_TYPES = ['CC', 'CE', 'NIT', 'Pasaporte', 'TI']

function fmt(n: number) {
  return '$' + n.toLocaleString('es-CO')
}

function formatCardNumber(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') ?? ''
  const depositParam = parseInt(searchParams.get('deposit') ?? '0', 10) || 0
  const isGuest = searchParams.get('guest') === '1'

  const [info, setInfo] = useState<PaymentInfo | null>(null)
  const [acceptance, setAcceptance] = useState<AcceptanceTokens | null>(null)
  const [selected, setSelected] = useState<Method | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  // Nequi
  const [nequiPhone, setNequiPhone] = useState('')

  // PSE / Bancolombia shared
  const [banks, setBanks] = useState<PseBank[]>([])
  const [bankCode, setBankCode] = useState('')
  const [userType, setUserType] = useState(0)
  const [idType, setIdType] = useState('CC')
  const [idNumber, setIdNumber] = useState('')

  useEffect(() => {
    if (!orderNumber) return
    paymentService.getInfo(orderNumber).then((data) => {
      setInfo(data)
      if (data.status === 'approved') {
        router.replace(`/tracking?order=${orderNumber}`)
      }
      if (data.customer_name) setCardHolder(data.customer_name)
      if (data.customer_phone) setNequiPhone(data.customer_phone)
    }).catch(() => {})
    paymentService.getAcceptanceTokens().then(setAcceptance).catch(() => {})
  }, [orderNumber, router])

  useEffect(() => {
    if (selected === 'PSE' || selected === 'BANCOLOMBIA_TRANSFER') {
      if (banks.length === 0) {
        paymentService.getPseBanks().then(setBanks).catch(() => {})
      }
    }
  }, [selected, banks.length])

  const deposit = info?.deposit_amount ?? depositParam

  async function handleSubmit() {
    if (!selected || !orderNumber) return
    setLoading(true)
    setError('')

    const accToken = acceptance?.acceptance_token ?? ''
    const authToken = acceptance?.personal_auth_token ?? ''

    try {
      let result

      if (selected === 'CARD') {
        if (!cardNumber.replace(/\s/g, '') || !cardHolder || !expiry || !cvv) {
          setError('Completa todos los datos de tu tarjeta.')
          setLoading(false)
          return
        }
        const [expM, expY] = expiry.split('/')
        const token = await paymentService.tokenizeCard({
          number: cardNumber.replace(/\s/g, ''),
          cvc: cvv,
          exp_month: expM ?? '',
          exp_year: expY ?? '',
          card_holder: cardHolder,
        })
        result = await paymentService.processCard(orderNumber, token, accToken, authToken)

      } else if (selected === 'NEQUI') {
        if (!nequiPhone.trim()) { setError('Ingresa tu número de celular Nequi.'); setLoading(false); return }
        result = await paymentService.processNequi(orderNumber, nequiPhone.trim(), accToken, authToken)

      } else if (selected === 'PSE') {
        if (!bankCode || !idNumber.trim()) { setError('Completa todos los campos.'); setLoading(false); return }
        result = await paymentService.processPse(orderNumber, bankCode, userType, idType, idNumber.trim(), accToken, authToken)

      } else {
        if (!idNumber.trim()) { setError('Ingresa tu número de documento.'); setLoading(false); return }
        result = await paymentService.processBancolombia(orderNumber, userType, idType, idNumber.trim(), accToken, authToken)
      }

      const confirmedParam = result.status === 'APPROVED' ? '&confirmed=1' : ''
      const guestParam = isGuest ? '&guest=1' : ''
      const emailParam = isGuest && info?.customer_email
        ? `&email=${encodeURIComponent(info.customer_email)}`
        : ''

      if (result.status === 'APPROVED' || result.status === 'PENDING') {
        if (result.redirect_url) {
          window.location.href = result.redirect_url
        } else {
          router.push(`/order-confirmed?order=${orderNumber}${confirmedParam}${guestParam}${emailParam}`)
        }
      } else {
        setError('Pago rechazado. Verifica tus datos e intenta con otro método.')
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.data?.detail ||
        'Error procesando el pago. Por favor intenta de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream-warm)' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(27,42,74,.07)', padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/mimittos/logo-dark-small.png" alt="MIMITTOS" width={32} height={32} />
          <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>MIMITTOS</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-warm)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M12 2 4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6z" /></svg>
          Pago seguro · Wompi
        </div>
      </div>

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center' }}>
          {(['Carrito', 'Datos', 'Pago', 'Listo'] as const).map((label, i) => {
            const done = i < 3
            const past = i < 2
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: done ? 'var(--coral)' : '#fff', color: done ? '#fff' : 'var(--gray-warm)', border: done ? 'none' : '1.5px solid rgba(27,42,74,.12)', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 12 }}>
                    {past ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: done ? 700 : 500, color: done ? 'var(--navy)' : 'var(--gray-warm)' }}>{label}</span>
                </div>
                {i < 3 && <div style={{ width: 28, height: 1.5, background: done ? 'var(--coral)' : 'rgba(27,42,74,.1)' }} />}
              </div>
            )
          })}
        </div>

        {/* Order info */}
        {orderNumber && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 28, boxShadow: '0 2px 12px rgba(27,42,74,.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: deposit > 0 && info?.total_amount ? 12 : 0 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 2 }}>Pedido</div>
                <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>{orderNumber}</div>
              </div>
              {deposit > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-warm)', marginBottom: 2 }}>Abono (50%)</div>
                  <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, color: 'var(--terracotta)', fontSize: 22 }}>{fmt(deposit)}</div>
                </div>
              )}
            </div>
            {info?.total_amount && info.total_amount > 0 && (
              <div style={{ borderTop: '1px dashed rgba(27,42,74,.1)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-warm)' }}>
                <span>Total del pedido: <b style={{ color: 'var(--navy)' }}>{fmt(info.total_amount)}</b></span>
                <span>Saldo al recibir: <b style={{ color: 'var(--navy)' }}>{fmt(info.balance_amount)}</b></span>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>Paso 3 de 4</div>
          <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 28, color: 'var(--navy)', margin: 0 }}>¿Cómo quieres pagar?</h1>
          <p style={{ color: 'var(--gray-warm)', fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>Elige tu método y completa el pago aquí mismo.</p>
        </div>

        {/* Method grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {METHODS.map((m) => {
            const isSel = selected === m.id
            return (
              <button key={m.id} onClick={() => { setSelected(m.id); setError('') }}
                style={{ background: isSel ? m.bg : '#fff', border: `2px solid ${isSel ? 'var(--coral)' : 'rgba(27,42,74,.08)'}`, borderRadius: 18, padding: '18px 14px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: isSel ? '0 6px 24px rgba(212,132,138,.2)' : '0 2px 8px rgba(27,42,74,.05)', transform: isSel ? 'translateY(-2px)' : 'none', transition: 'all .18s ease', position: 'relative', outline: 'none' }}>
                {isSel && (
                  <div style={{ position: 'absolute', top: 9, right: 9, width: 20, height: 20, borderRadius: '50%', background: 'var(--coral)', display: 'grid', placeItems: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
                {m.logo}
                <div>
                  <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: isSel ? 'var(--coral)' : 'var(--navy)', marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-warm)' }}>{m.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ——— Method forms ——— */}
        {selected === 'CARD' && (
          <div style={formCard}>
            <div style={formTitle}>Datos de tu tarjeta</div>
            <div style={field}>
              <label style={lbl}>Número de tarjeta</label>
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                style={{ ...inp, fontFamily: 'monospace', fontSize: 16, letterSpacing: 2 }}
              />
            </div>
            <div style={field}>
              <label style={lbl}>Nombre del titular</label>
              <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Como aparece en la tarjeta" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={field}>
                <label style={lbl}>Vencimiento</label>
                <input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" maxLength={5} style={inp} />
              </div>
              <div style={field}>
                <label style={lbl}>CVV</label>
                <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="···" maxLength={4} type="password" style={inp} />
              </div>
            </div>
            <p style={note}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M12 2 4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6z" /></svg>
              Tus datos se cifran con TLS y se tokenizan directamente con Wompi. MIMITTOS nunca almacena datos de tarjeta.
            </p>
          </div>
        )}

        {selected === 'NEQUI' && (
          <div style={formCard}>
            <div style={formTitle}>Pago con Nequi</div>
            <p style={{ color: 'var(--gray-warm)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Ingresa el celular asociado a tu cuenta Nequi. Recibirás una notificación push para aprobar el pago de <strong>{fmt(deposit)}</strong>.
            </p>
            <div style={field}>
              <label style={lbl}>Número de celular</label>
              <input
                value={nequiPhone}
                onChange={(e) => setNequiPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="3001234567"
                maxLength={10}
                type="tel"
                style={{ ...inp, fontSize: 16, letterSpacing: 1 }}
              />
            </div>
          </div>
        )}

        {(selected === 'PSE' || selected === 'BANCOLOMBIA_TRANSFER') && (
          <div style={formCard}>
            <div style={formTitle}>{selected === 'PSE' ? 'Débito PSE' : 'Botón Bancolombia'}</div>
            <p style={{ color: 'var(--gray-warm)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              {selected === 'PSE'
                ? 'Serás redirigido al portal PSE de tu banco para autenticar el débito.'
                : 'Serás redirigido a la app Bancolombia para confirmar el pago.'}
            </p>

            {selected === 'PSE' && (
              <div style={field}>
                <label style={lbl}>Banco</label>
                <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} style={inp}>
                  <option value="">— Selecciona tu banco —</option>
                  {banks.map((b) => (
                    <option key={b.financial_institution_code} value={b.financial_institution_code}>
                      {b.financial_institution_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={field}>
              <label style={lbl}>Tipo de persona</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[{ val: 0, label: 'Natural' }, { val: 1, label: 'Jurídica' }].map((opt) => (
                  <button key={opt.val} type="button" onClick={() => setUserType(opt.val)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${userType === opt.val ? 'var(--coral)' : 'rgba(27,42,74,.1)'}`, background: userType === opt.val ? 'var(--cream-peach)' : '#fff', color: userType === opt.val ? 'var(--coral)' : 'var(--navy)', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div style={field}>
                <label style={lbl}>Tipo de ID</label>
                <select value={idType} onChange={(e) => setIdType(e.target.value)} style={inp}>
                  {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={field}>
                <label style={lbl}>Número de documento</label>
                <input value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))} placeholder="1234567890" style={inp} />
              </div>
            </div>
          </div>
        )}

        {/* Terms acceptance */}
        {acceptance?.acceptance_permalink && (
          <p style={{ fontSize: 11, color: 'var(--gray-warm)', textAlign: 'center', marginBottom: 10, lineHeight: 1.5 }}>
            Al pagar aceptas los{' '}
            <a href={acceptance.acceptance_permalink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--coral)', textDecoration: 'underline' }}>
              términos y condiciones de Wompi
            </a>
          </p>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #f5c6cb', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#c23b3b', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={handleSubmit}
          disabled={!selected || loading}
          style={{ width: '100%', padding: '17px 20px', borderRadius: 16, background: selected ? 'var(--coral)' : 'rgba(27,42,74,.1)', color: selected ? '#fff' : 'var(--gray-warm)', fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 17, border: 'none', cursor: selected && !loading ? 'pointer' : 'not-allowed', boxShadow: selected ? '0 10px 28px rgba(212,132,138,.38)' : 'none', transition: 'all .2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? 'Procesando...'
            : selected
              ? `Pagar${deposit > 0 ? ` · ${fmt(deposit)}` : ''}`
              : 'Selecciona un método de pago'
          }
          {!loading && selected && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          )}
        </button>

        {/* Back link */}
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

const formCard: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '20px 20px 4px', marginBottom: 20, boxShadow: '0 2px 12px rgba(27,42,74,.06)', display: 'flex', flexDirection: 'column', gap: 14 }
const formTitle: React.CSSProperties = { fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 2 }
const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--navy)', letterSpacing: '.04em', textTransform: 'uppercase' }
const inp: React.CSSProperties = { background: 'var(--cream-warm)', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 10, padding: '11px 13px', fontFamily: 'inherit', fontSize: 14, color: 'var(--navy)', outline: 'none', width: '100%' }
const note: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11, color: 'var(--gray-warm)', lineHeight: 1.5, marginTop: 4, paddingBottom: 4 }
