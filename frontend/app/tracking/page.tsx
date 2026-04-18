'use client'

import Link from 'next/link'
import { useState } from 'react'

const ORDER_STATUS = [
  { step: 1, label: 'Pedido recibido', desc: 'Confirmamos tu pedido y el abono.', done: true, date: 'Lun 14 abr · 10:32 am' },
  { step: 2, label: 'En producción', desc: 'Tu peluche está siendo cosido a mano.', done: true, date: 'Mar 15 abr · 9:00 am' },
  { step: 3, label: 'Control de calidad', desc: 'Revisamos cada detalle antes de empacar.', done: true, date: 'Mié 16 abr · 2:00 pm' },
  { step: 4, label: 'Listo para envío', desc: 'Empacado con amor y esperando al mensajero.', done: false, date: 'Pronto' },
  { step: 5, label: 'En camino', desc: 'Tu peluche está en ruta hacia ti.', done: false, date: 'Pronto' },
  { step: 6, label: '¡Entregado!', desc: 'Ya llegó a tus brazos. ¡Disfrútalo!', done: false, date: 'Pronto' },
]

export default function TrackingPage() {
  const [orderNum, setOrderNum] = useState('MIT-2024-0847')
  const [searched, setSearched] = useState(true)

  const currentStep = ORDER_STATUS.filter((s) => s.done).length

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
          Ingresa tu número de pedido y te mostramos en tiempo real cómo va la producción y el envío de tu peluche.
        </p>
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50 }}>
        {/* Search + status */}
        <div>
          {/* Search */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
            <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 16 }}>Número de pedido</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={orderNum} onChange={(e) => setOrderNum(e.target.value)} placeholder="Ej: MIT-2024-0847"
                style={{ flex: 1, background: 'var(--cream-warm)', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 12, padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, color: 'var(--navy)', outline: 'none' }} />
              <button onClick={() => setSearched(true)} style={{ padding: '12px 22px', borderRadius: 12, background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Buscar
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray-warm)', marginTop: 10 }}>
              Puedes encontrar tu número de pedido en el correo de confirmación.
            </p>
          </div>

          {searched && (
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--coral)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Pedido encontrado</div>
                  <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--navy)' }}>{orderNum}</h3>
                </div>
                <span style={{ background: 'var(--pink-melo)', color: 'var(--terracotta)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  En producción
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {ORDER_STATUS.map((s, i) => (
                  <div key={s.step} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                    {i < ORDER_STATUS.length - 1 && (
                      <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, background: s.done ? 'var(--coral)' : 'rgba(27,42,74,.08)', zIndex: 0 }} />
                    )}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.done ? 'var(--coral)' : '#fff', border: s.done ? 'none' : '2px solid rgba(27,42,74,.1)', color: s.done ? '#fff' : 'var(--gray-warm)', display: 'grid', placeItems: 'center', flexShrink: 0, zIndex: 1, fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13 }}>
                      {s.done ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                      ) : s.step}
                    </div>
                    <div style={{ paddingBottom: i < ORDER_STATUS.length - 1 ? 28 : 0 }}>
                      <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: s.done ? 'var(--navy)' : 'var(--gray-warm)' }}>{s.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-warm)', marginTop: 2 }}>{s.desc}</div>
                      <div style={{ fontSize: 11, color: s.done ? 'var(--coral)' : 'var(--gray-warm)', fontWeight: 600, marginTop: 4 }}>{s.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order details */}
        {searched && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Progress bar */}
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 16 }}>Progreso general</h3>
              <div style={{ height: 12, background: 'var(--pink-melo)', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${(currentStep / ORDER_STATUS.length) * 100}%`, background: 'linear-gradient(90deg,var(--coral),var(--coral-soft))', borderRadius: 999, transition: 'width .5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-warm)', fontWeight: 600 }}>
                <span>Paso {currentStep} de {ORDER_STATUS.length}</span>
                <b style={{ color: 'var(--terracotta)' }}>{Math.round((currentStep / ORDER_STATUS.length) * 100)}% completado</b>
              </div>
            </div>

            {/* Order info */}
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 20 }}>Detalle del pedido</h3>
              {[
                ['Producto', 'Osito Coral · Mediano · Rosa Coral'],
                ['Extras', 'Bordado del nombre "Sofía"'],
                ['Total', '$146.000'],
                ['Abono pagado', '$73.000'],
                ['Saldo contraentrega', '$73.000'],
                ['Envío a', 'Medellín, Antioquia'],
                ['Fecha de pedido', '14 de abril de 2025'],
                ['Entrega estimada', '21–23 de abril de 2025'],
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
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif",
  fontWeight: 600, fontSize: 13, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
}
