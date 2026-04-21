'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { orderService } from '@/lib/services/orderService'
import { useAuthStore } from '@/lib/stores/authStore'
import type { OrderListItem, OrderStatus } from '@/lib/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; color: string; pulse: boolean }> = {
  pending_payment: { label: 'Pendiente de pago', bg: '#FFF3E0', color: '#E65100', pulse: false },
  payment_confirmed: { label: 'Pago confirmado', bg: '#E3F2FD', color: '#1565C0', pulse: false },
  in_production: { label: 'En producción', bg: '#FFF0E8', color: '#B8696F', pulse: true },
  shipped: { label: 'Despachado', bg: '#E3F2FD', color: '#1976D2', pulse: true },
  delivered: { label: 'Entregado', bg: '#E8F5E9', color: '#2E7D32', pulse: false },
  cancelled: { label: 'Cancelado', bg: '#FFEBEE', color: '#C62828', pulse: false },
}

const NAV_ITEMS = [
  { label: 'Mis pedidos', href: '/orders', active: true },
]

function fmt(n: number) { return '$' + n.toLocaleString('es-CO') }

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    orderService
      .getMyOrders()
      .then((data) => setOrders(data))
      .catch(() => router.push('/sign-in'))
      .finally(() => setLoading(false))
  }, [])

  const fullName = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Usuario'
    : 'Usuario'
  const statusKeys = Object.keys(STATUS_CONFIG) as OrderStatus[]

  const visible = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false
    if (search && !`${o.order_number} ${o.customer_name}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const countByStatus = (s: OrderStatus) => orders.filter((o) => o.status === s).length

  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-warm)' }}>
        <Link href="/" style={{ color: 'var(--gray-warm)' }}>Inicio</Link>
        <span style={{ opacity: .5 }}>/</span>
        <b style={{ color: 'var(--navy)', fontWeight: 700 }}>Mis pedidos</b>
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 20px' }}>
        <div style={eyebrowStyle}>Tu historia con nosotros</div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 46, color: 'var(--navy)', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 10 }}>
          Hola, {user?.first_name ?? 'amigo'} ♡
        </h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 16, maxWidth: 600, lineHeight: 1.55 }}>
          Todos tus pedidos y personalizaciones en un solo lugar.
        </p>
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px 60px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 40, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 22, boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 110 }}>
          <div style={{ paddingBottom: 18, borderBottom: '1px dashed rgba(212,132,138,.25)', marginBottom: 14 }}>
            <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{fullName}</strong>
            <span style={{ fontSize: 12, color: 'var(--gray-warm)' }}>{user?.email}</span>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map(({ label, href, active }) => (
              <li key={label}>
                <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: active ? '#fff' : 'var(--navy)', background: active ? 'var(--coral)' : 'transparent', textDecoration: 'none' }}>
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <button onClick={() => signOut()} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--navy)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cerrar sesión
              </button>
            </li>
          </ul>
        </aside>

        {/* Main */}
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setFilter('all')} style={filterBtn(filter === 'all')}>
              Todos <span style={{ opacity: .7 }}>· {orders.length}</span>
            </button>
            {statusKeys.map((s) => (
              <button key={s} onClick={() => setFilter(s)} style={filterBtn(filter === s)}>
                {STATUS_CONFIG[s].label} <span style={{ opacity: .7 }}>· {countByStatus(s)}</span>
              </button>
            ))}
            <div style={{ marginLeft: 'auto', background: '#fff', border: '1.5px solid rgba(27,42,74,.08)', borderRadius: 999, display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 8, width: 240 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--gray-warm)', flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por # pedido..." style={{ border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13, color: 'var(--navy)', width: '100%', outline: 'none' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-warm)' }}>Cargando pedidos...</div>
          ) : visible.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 60, textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 48 }}>🧸</div>
              <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--navy)', margin: '16px 0 10px' }}>
                {orders.length === 0 ? '¡Aún no tienes pedidos!' : 'Sin resultados'}
              </h3>
              <p style={{ color: 'var(--gray-warm)' }}>
                {orders.length === 0 ? <Link href="/catalog" style={{ color: 'var(--coral)', fontWeight: 700 }}>Explora el catálogo →</Link> : 'Prueba con otro filtro'}
              </p>
            </div>
          ) : visible.map((order) => {
            const sc = STATUS_CONFIG[order.status]

            return (
              <div key={order.order_number} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: 16, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '18px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, alignItems: 'center', background: 'var(--cream-warm)', borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
                  <div><div style={cellLbl}>Pedido</div><div style={cellVal}>{order.order_number}</div></div>
                  <div><div style={cellLbl}>Fecha</div><div style={cellVal}>{fmtDate(order.created_at)}</div></div>
                  <div><div style={cellLbl}>Total</div><div style={{ ...cellVal, color: 'var(--terracotta)', fontSize: 16 }}>{fmt(order.total_amount)}</div></div>
                  <div>
                    <div style={cellLbl}>Estado</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '.04em', background: sc.bg, color: sc.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: sc.pulse ? 'pulseDot 1.8s ease-in-out infinite' : 'none' }} />
                      {sc.label.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Summary row */}
                <div style={{ padding: '14px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <span style={{ fontSize: 13, color: 'var(--gray-warm)' }}>{order.city}, {order.department}</span>
                  </div>
                  <span style={{ display: 'inline-flex', gap: 6, padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: '#FFF3E0', color: '#E65100' }}>
                    💳 Abono {fmt(order.deposit_amount)} · Saldo {fmt(order.balance_amount)}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/tracking?order=${order.order_number}`} style={{ padding: '9px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: 'var(--coral)', color: '#fff', textDecoration: 'none' }}>
                      Seguimiento →
                    </Link>
                  </div>
                </div>

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

function filterBtn(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: 999, background: active ? 'var(--coral)' : '#fff',
    border: `1.5px solid ${active ? 'var(--coral)' : 'rgba(27,42,74,.08)'}`,
    fontSize: 13, fontWeight: 600, color: active ? '#fff' : 'var(--navy)',
    cursor: 'pointer', fontFamily: 'inherit',
  }
}
