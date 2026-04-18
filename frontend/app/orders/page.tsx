'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'

type OrderStatus = 'prod' | 'ship' | 'deliv' | 'recv' | 'cancel'

interface OrderItem {
  name: string
  detail: string
  price: string
  img: string
}

interface Order {
  id: string
  date: string
  total: string
  totalCrossed?: boolean
  status: OrderStatus
  statusLabel: string
  thumbs: string[]
  summary: string
  detail: string
  payChip: { label: string; type: 'partial' | 'paid' | 'refund' }
  items: OrderItem[]
  payment: { label: string; value: string; type?: 'paid' | 'pending' }[]
  actions: { label: string; href: string; variant: 'primary' | 'ghost' }[]
}

const ORDERS: Order[] = [
  {
    id: '#MIM-2026-0184', date: '14 abr 2026', total: '$455.000', status: 'prod', statusLabel: 'EN PRODUCCIÓN',
    thumbs: ['/mimittos/gal-01.svg', '/mimittos/prod-02.svg', '/mimittos/prod-06.svg'],
    summary: 'Osito Coral + 2 más',
    detail: '3 peluches · 4 unidades · Medellín',
    payChip: { label: '💳 Abono pagado · Saldo $227.500', type: 'partial' },
    items: [
      { name: 'Osito Coral', detail: 'Mediano 35cm · Rosa Coral · Bordado "Sofía" × 1', price: '$146.000', img: '/mimittos/gal-01.svg' },
      { name: 'Conejito Lucía', detail: 'Pequeño 20cm · Rosa Pastel × 2', price: '$184.000', img: '/mimittos/prod-02.svg' },
      { name: 'Pandita Sueño', detail: 'Mediano 35cm · Navy · Caja premium + Nota × 1', price: '$125.000', img: '/mimittos/prod-06.svg' },
    ],
    payment: [
      { label: 'Subtotal', value: '$455.000' },
      { label: 'Envío', value: 'Gratis' },
      { label: 'Abono PSE (14 abr)', value: '✓ $227.500', type: 'paid' },
      { label: 'Saldo contraentrega', value: '$227.500', type: 'pending' },
    ],
    actions: [{ label: 'Ver seguimiento', href: '/tracking', variant: 'primary' }, { label: 'Contactar', href: '/contact', variant: 'ghost' }],
  },
  {
    id: '#MIM-2026-0172', date: '08 abr 2026', total: '$198.000', status: 'ship', statusLabel: 'DESPACHADO',
    thumbs: ['/mimittos/prod-04.svg', '/mimittos/prod-09.svg'],
    summary: 'Elefantito Dulce + 1 más',
    detail: 'Guía: SV-48219374 · Servientrega · En camino',
    payChip: { label: '💳 Abono pagado', type: 'partial' },
    items: [],
    payment: [],
    actions: [{ label: 'Rastrear', href: '/tracking', variant: 'primary' }, { label: 'Reordenar', href: '/catalog', variant: 'ghost' }],
  },
  {
    id: '#MIM-2026-0158', date: '22 mar 2026', total: '$168.000', status: 'deliv', statusLabel: 'ENTREGADO',
    thumbs: ['/mimittos/prod-05.svg'],
    summary: 'Osito Clásico Grande',
    detail: 'Recibido el 28 mar · ⭐⭐⭐⭐⭐ "Hermoso"',
    payChip: { label: '✓ Pagado completo', type: 'paid' },
    items: [],
    payment: [],
    actions: [{ label: 'Reordenar', href: '/catalog', variant: 'primary' }, { label: 'Factura', href: '#', variant: 'ghost' }],
  },
  {
    id: '#MIM-2026-0131', date: '14 feb 2026', total: '$254.000', status: 'deliv', statusLabel: 'ENTREGADO',
    thumbs: ['/mimittos/prod-11.svg', '/mimittos/prod-07.svg', '/mimittos/prod-08.svg'],
    summary: 'San Valentín pack · 3 peluches',
    detail: 'Entregado el 13 feb · Regalo especial 💝',
    payChip: { label: '✓ Pagado completo', type: 'paid' },
    items: [],
    payment: [],
    actions: [{ label: 'Reordenar', href: '/catalog', variant: 'primary' }, { label: 'Factura', href: '#', variant: 'ghost' }],
  },
  {
    id: '#MIM-2025-0924', date: '18 dic 2025', total: '$89.000', status: 'deliv', statusLabel: 'ENTREGADO',
    thumbs: ['/mimittos/prod-12.svg'],
    summary: 'Leoncito Sol · Edición navideña',
    detail: 'Regalo del abuelito Juan · Entregado 22 dic',
    payChip: { label: '✓ Pagado completo', type: 'paid' },
    items: [],
    payment: [],
    actions: [{ label: 'Reordenar', href: '/catalog', variant: 'primary' }, { label: 'Factura', href: '#', variant: 'ghost' }],
  },
  {
    id: '#MIM-2025-0667', date: '15 sep 2025', total: '$75.000', status: 'cancel', statusLabel: 'CANCELADO', totalCrossed: true,
    thumbs: ['/mimittos/prod-03.svg'],
    summary: 'Zorro Amiguito',
    detail: 'Cancelado por el cliente · Reembolso procesado',
    payChip: { label: 'Reembolsado', type: 'refund' },
    items: [],
    payment: [],
    actions: [{ label: 'Volver a pedir', href: '/catalog', variant: 'ghost' }],
  },
]

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
  prod: { bg: '#FFF0E8', color: '#B8696F' },
  ship: { bg: '#E3F2FD', color: '#1976D2' },
  deliv: { bg: '#E8F5E9', color: '#2E7D32' },
  recv: { bg: 'var(--pink-melo)', color: 'var(--coral)' },
  cancel: { bg: '#FFEBEE', color: '#C62828' },
}

const NAV_ITEMS = [
  { label: 'Mis pedidos', href: '/orders', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /></svg>, active: true },
  { label: 'Favoritos', href: '#', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg> },
  { label: 'Direcciones', href: '#', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg> },
  { label: 'Métodos de pago', href: '#', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg> },
  { label: 'Mis datos', href: '/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg> },
]

const FILTERS = [
  { key: 'all', label: 'Todos', count: 6 },
  { key: 'prod', label: 'En producción', count: 1 },
  { key: 'ship', label: 'Despachados', count: 1 },
  { key: 'deliv', label: 'Entregados', count: 3 },
  { key: 'cancel', label: 'Cancelados', count: 1 },
]

export default function OrdersPage() {
  const { user, signOut } = useAuthStore()
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [openOrder, setOpenOrder] = useState<string | null>(ORDERS[0].id)

  const initials = user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U' : 'S'
  const fullName = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Usuario' : 'Sofía Martínez'

  const visible = ORDERS.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false
    if (search && !`${o.id} ${o.summary}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <span>Mi cuenta</span>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Historial de compras</b>
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 20px' }}>
        <div style={eyebrowStyle}>Tu historia con nosotros</div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 46, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 10 }}>Hola, {user?.first_name ?? 'Sofía'} ♡</h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 16, maxWidth: 600, lineHeight: 1.55 }}>
          Todos tus pedidos, personalizaciones y recuerdos en un solo lugar. Revisa el estado, consulta el abono o vuelve a pedir lo que tanto te gustó.
        </p>
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 60px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 40, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 22, boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 110 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 18, borderBottom: '1px dashed rgba(212,132,138,.25)', marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 18 }}>
              {initials}
            </div>
            <div>
              <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{fullName}</strong>
              <span style={{ fontSize: 12, color: 'var(--gray-warm)' }}>Desde abr 2025</span>
            </div>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map(({ label, href, icon, active }) => (
              <li key={label}>
                <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: active ? '#fff' : 'var(--navy)', background: active ? 'var(--coral)' : 'transparent', textDecoration: 'none' }}>
                  {icon} {label}
                </Link>
              </li>
            ))}
            <li>
              <button onClick={() => signOut()} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--navy)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Cerrar sesión
              </button>
            </li>
          </ul>
        </aside>

        {/* Main */}
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 26 }}>
            {[
              { label: 'Pedidos totales', value: '7', sub: '1 en producción' },
              { label: 'Total invertido', value: '$1.284.000', sub: 'Este año' },
              { label: 'Peluches recibidos', value: '12', sub: '🧸 en tu vida' },
              { label: 'Saldo pendiente', value: '$227.500', sub: 'Contraentrega', pending: true },
            ].map(({ label, value, sub, pending }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--gray-warm)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 24, color: pending ? 'var(--terracotta)' : 'var(--navy)', lineHeight: 1.1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-warm)', marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {FILTERS.map(({ key, label, count }) => (
              <button key={key} onClick={() => setFilter(key)} style={{ padding: '8px 16px', borderRadius: 999, background: filter === key ? 'var(--coral)' : '#fff', border: `1.5px solid ${filter === key ? 'var(--coral)' : 'rgba(27,42,74,.08)'}`, fontSize: 13, fontWeight: 600, color: filter === key ? '#fff' : 'var(--navy)', cursor: 'pointer', fontFamily: 'inherit' }}>
                {label} <span style={{ opacity: .7 }}>· {count}</span>
              </button>
            ))}
            <div style={{ marginLeft: 'auto', background: '#fff', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 999, display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 8, width: 240 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--gray-warm)', flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por # o peluche..." style={{ border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13, color: 'var(--navy)', width: '100%', outline: 'none' }} />
            </div>
          </div>

          {/* Order cards */}
          {visible.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 60, textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 48 }}>🧸</div>
              <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--navy)', margin: '16px 0 10px' }}>No encontramos pedidos</h3>
              <p style={{ color: 'var(--gray-warm)' }}>Prueba con otro filtro</p>
            </div>
          ) : visible.map((order) => {
            const isOpen = openOrder === order.id
            const sc = STATUS_COLORS[order.status]
            const pulsing = order.status === 'prod' || order.status === 'ship'

            return (
              <div key={order.id} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: 16, overflow: 'hidden' }}>
                {/* Header */}
                <div onClick={() => setOpenOrder(isOpen ? null : order.id)} style={{ padding: '18px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 20, alignItems: 'center', background: 'var(--cream-warm)', borderBottom: '1px dashed rgba(212,132,138,.2)', cursor: 'pointer' }}>
                  <div><div style={cellLbl}>Pedido</div><div style={cellVal}>{order.id}</div></div>
                  <div><div style={cellLbl}>Fecha</div><div style={cellVal}>{order.date}</div></div>
                  <div><div style={cellLbl}>Total</div><div style={{ ...cellVal, color: 'var(--terracotta)', fontSize: 16, textDecoration: order.totalCrossed ? 'line-through' : 'none' }}>{order.total}</div></div>
                  <div>
                    <div style={cellLbl}>Estado</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '.04em', background: sc.bg, color: sc.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: pulsing ? 'pulseDot 1.8s ease-in-out infinite' : 'none' }} />
                      {order.statusLabel}
                    </span>
                  </div>
                  <svg style={{ color: 'var(--gray-warm)', transition: 'transform .3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>

                {/* Body */}
                <div style={{ padding: '18px 24px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex' }}>
                    {order.thumbs.map((src, i) => (
                      <div key={i} style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', background: 'var(--pink-melo)', border: '3px solid #fff', marginLeft: i === 0 ? 0 : -12, boxShadow: 'var(--shadow-sm)', position: 'relative', flexShrink: 0 }}>
                        <Image src={src} alt="" fill style={{ objectFit: 'cover', opacity: order.status === 'cancel' ? .6 : 1 }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h4 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 2 }}>{order.summary}</h4>
                    <span style={{ fontSize: 12, color: 'var(--gray-warm)' }}>{order.detail}</span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: order.payChip.type === 'paid' ? '#E8F5E9' : order.payChip.type === 'partial' ? '#FFF3E0' : 'var(--cream-peach)', color: order.payChip.type === 'paid' ? '#2E7D32' : order.payChip.type === 'partial' ? '#E65100' : 'var(--navy)' }}>
                    {order.payChip.label}
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {order.actions.map(({ label, href, variant }) => (
                      <Link key={label} href={href} style={{ padding: '9px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', background: variant === 'primary' ? 'var(--coral)' : '#fff', color: variant === 'primary' ? '#fff' : 'var(--navy)', border: variant === 'ghost' ? '1.5px solid rgba(27,42,74,.1)' : 'none' }}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && order.items.length > 0 && (
                  <div style={{ borderTop: '1px dashed rgba(212,132,138,.2)', padding: '20px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {order.items.map((item) => (
                        <div key={item.name} style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 14px', background: 'var(--cream-warm)', borderRadius: 12 }}>
                          <div style={{ width: 50, height: 50, borderRadius: 10, overflow: 'hidden', background: 'var(--pink-melo)', position: 'relative' }}>
                            <Image src={item.img} alt={item.name} fill style={{ objectFit: 'cover' }} />
                          </div>
                          <div>
                            <h5 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{item.name}</h5>
                            <p style={{ fontSize: 11, color: 'var(--gray-warm)', marginTop: 2 }}>{item.detail}</p>
                          </div>
                          <span style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--terracotta)' }}>{item.price}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'var(--cream-peach)', borderRadius: 14, padding: 16 }}>
                      <h5 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--navy)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Desglose del pago</h5>
                      {order.payment.map(({ label, value, type }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px dashed rgba(212,132,138,.25)' }}>
                          <span>{label}</span>
                          <b style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: type === 'paid' ? '#4CAF50' : type === 'pending' ? 'var(--terracotta)' : 'var(--navy)' }}>{value}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--coral)', fontFamily: "'Quicksand', sans-serif",
  fontWeight: 600, fontSize: 13, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
}

const cellLbl: React.CSSProperties = {
  fontSize: 10, color: 'var(--gray-warm)', textTransform: 'uppercase',
  letterSpacing: '.08em', fontWeight: 700, marginBottom: 3,
}

const cellVal: React.CSSProperties = {
  fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--navy)',
}
