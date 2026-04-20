'use client'

import { useEffect, useState } from 'react'

import { api } from '@/lib/services/http'
import { orderService } from '@/lib/services/orderService'
import { useRequireAuth } from '@/lib/hooks/useRequireAuth'
import type { OrderListItem, OrderStatus, UserListItem } from '@/lib/types'

const STATUS_OPTIONS: OrderStatus[] = [
  'pending_payment', 'payment_confirmed', 'in_production', 'shipped', 'delivered', 'cancelled',
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente pago',
  payment_confirmed: 'Pago confirmado',
  in_production: 'En producción',
  shipped: 'Despachado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
  pending_payment: { bg: '#FFF3E0', color: '#E65100' },
  payment_confirmed: { bg: '#E3F2FD', color: '#1565C0' },
  in_production: { bg: '#FFF0E8', color: '#B8696F' },
  shipped: { bg: '#E3F2FD', color: '#1976D2' },
  delivered: { bg: '#E8F5E9', color: '#2E7D32' },
  cancelled: { bg: '#FFEBEE', color: '#C62828' },
}

type KPIs = {
  new_orders?: number
  in_production?: number
  pending_dispatch?: number
  confirmed_deposits?: number
  [key: string]: unknown
}

function fmt(n: number) { return '$' + n.toLocaleString('es-CO') }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function BackofficePage() {
  const { isAuthenticated } = useRequireAuth()

  const [activeTab, setActiveTab] = useState<'orders' | 'users'>('orders')

  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [orderFilter, setOrderFilter] = useState<OrderStatus | ''>('')
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [users, setUsers] = useState<UserListItem[]>([])

  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({})
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return
    setLoading(true)
    Promise.all([
      orderService.listOrders(orderFilter ? { status: orderFilter } : undefined),
      api.get('/analytics/kpis/').then((r) => r.data as KPIs).catch(() => null),
      api.get('/users/').then((r) => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
    ])
      .then(([ords, kpiData, usrs]) => {
        setOrders(ords)
        setKpis(kpiData)
        setUsers(usrs)
      })
      .catch(() => setError('No se pudo cargar la información del backoffice.'))
      .finally(() => setLoading(false))
  }, [isAuthenticated, orderFilter])

  async function handleStatusChange(orderNumber: string, newStatus: string) {
    setStatusUpdating(orderNumber)
    try {
      await orderService.updateStatus(orderNumber, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.order_number === orderNumber ? { ...o, status: newStatus as OrderStatus } : o))
      )
    } catch {
      alert('No se pudo actualizar el estado.')
    } finally {
      setStatusUpdating(null)
    }
  }

  async function handleTrackingUpdate(orderNumber: string) {
    const trackingNum = trackingInputs[orderNumber]?.trim()
    if (!trackingNum) return
    try {
      await orderService.updateTracking(orderNumber, trackingNum)
      setOrders((prev) =>
        prev.map((o) => o.order_number === orderNumber ? o : o)
      )
      setTrackingInputs((prev) => ({ ...prev, [orderNumber]: '' }))
    } catch {
      alert('No se pudo actualizar la guía.')
    }
  }

  if (!isAuthenticated) return null

  return (
    <main style={{ maxWidth: 1360, margin: '0 auto', padding: '30px 40px 60px' }}>
      <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 32, color: 'var(--navy)', marginBottom: 6 }}>
        Panel de administración
      </h1>
      <p style={{ color: 'var(--gray-warm)', fontSize: 15, marginBottom: 30 }}>Gestión de pedidos y usuarios de Peluchelandia</p>

      {/* KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 30 }}>
          {[
            { label: 'Pedidos nuevos (hoy)', value: kpis.new_orders ?? 0 },
            { label: 'En producción', value: kpis.in_production ?? 0 },
            { label: 'Por despachar', value: kpis.pending_dispatch ?? 0 },
            { label: 'Depósitos confirmados', value: typeof kpis.confirmed_deposits === 'number' ? fmt(kpis.confirmed_deposits) : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-warm)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--navy)' }}>{String(value)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['orders', 'users'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: 999, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: activeTab === tab ? 'var(--coral)' : '#fff', color: activeTab === tab ? '#fff' : 'var(--navy)', boxShadow: 'var(--shadow-sm)' }}>
            {tab === 'orders' ? `Pedidos (${orders.length})` : `Usuarios (${users.length})`}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--gray-warm)', marginBottom: 16 }}>Cargando...</p>}
      {error && <p style={{ color: '#c23b3b', marginBottom: 16 }}>{error}</p>}

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => setOrderFilter('')} style={filterBtn(!orderFilter)}>Todos</button>
            {STATUS_OPTIONS.map((s) => (
              <button key={s} onClick={() => setOrderFilter(s)} style={filterBtn(orderFilter === s)}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--cream-warm)', borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
                  {['Pedido', 'Cliente', 'Ciudad', 'Estado', 'Total', 'Abono', 'Fecha', 'Actualizar estado', 'Guía'].map((h) => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--navy)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const sc = STATUS_COLORS[o.status]
                  return (
                    <tr key={o.order_number} style={{ borderBottom: '1px dashed rgba(212,132,138,.12)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{o.order_number}</td>
                      <td style={{ padding: '10px 14px', maxWidth: 180 }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-warm)' }}>{o.customer_email}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--gray-warm)' }}>{o.city}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>
                          {STATUS_LABELS[o.status]}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--terracotta)', whiteSpace: 'nowrap' }}>{fmt(o.total_amount)}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--navy)', whiteSpace: 'nowrap' }}>{fmt(o.deposit_amount)}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--gray-warm)', whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          value={o.status}
                          disabled={statusUpdating === o.order_number}
                          onChange={(e) => handleStatusChange(o.order_number, e.target.value)}
                          style={{ background: '#fff', border: '1px solid rgba(27,42,74,.1)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--navy)', fontFamily: 'inherit', cursor: 'pointer' }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            value={trackingInputs[o.order_number] ?? ''}
                            onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [o.order_number]: e.target.value }))}
                            placeholder="Guía..."
                            style={{ width: 90, background: 'var(--cream-warm)', border: '1px solid rgba(27,42,74,.08)', borderRadius: 8, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit' }}
                          />
                          <button
                            onClick={() => handleTrackingUpdate(o.order_number)}
                            style={{ padding: '6px 10px', background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                          >
                            ✓
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!orders.length && !loading && (
                  <tr><td colSpan={9} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--gray-warm)' }}>Sin pedidos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--cream-warm)', borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
                {['Email', 'Rol', 'Staff', 'Activo'].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--navy)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px dashed rgba(212,132,138,.12)' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--navy)' }}>{u.email}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-warm)' }}>{u.role || '—'}</td>
                  <td style={{ padding: '10px 14px' }}><span style={{ color: u.is_staff ? '#2E7D32' : 'var(--gray-warm)', fontWeight: 600 }}>{u.is_staff ? 'Sí' : 'No'}</span></td>
                  <td style={{ padding: '10px 14px' }}><span style={{ color: u.is_active ? '#2E7D32' : '#C62828', fontWeight: 600 }}>{u.is_active ? 'Activo' : 'Inactivo'}</span></td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={4} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--gray-warm)' }}>Sin usuarios</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

function filterBtn(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${active ? 'var(--coral)' : 'rgba(27,42,74,.08)'}`,
    background: active ? 'var(--coral)' : '#fff',
    color: active ? '#fff' : 'var(--navy)',
    cursor: 'pointer', fontFamily: 'inherit',
  }
}
