'use client'

import { useEffect, useState } from 'react'

import { orderService } from '@/lib/services/orderService'
import type { OrderListItem, OrderStatus } from '@/lib/types'

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

function fmt(n: number) { return '$' + n.toLocaleString('es-CO') }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function PedidosAdminPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [filter, setFilter] = useState<OrderStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    loadOrders()
  }, [filter])

  async function loadOrders() {
    setLoading(true)
    setError('')
    try {
      const data = await orderService.listOrders(filter ? { status: filter } : undefined)
      setOrders(data)
    } catch {
      setError('No se pudieron cargar los pedidos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(orderNumber: string, newStatus: string) {
    setStatusUpdating(orderNumber)
    try {
      await orderService.updateStatus(orderNumber, newStatus)
      setOrders((prev) => prev.map((o) => o.order_number === orderNumber ? { ...o, status: newStatus as OrderStatus } : o))
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
      setTrackingInputs((prev) => ({ ...prev, [orderNumber]: '' }))
    } catch {
      alert('No se pudo actualizar la guía.')
    }
  }

  return (
    <div style={{ padding: '30px 40px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--navy)', marginBottom: 4 }}>Pedidos</h1>
        <p style={{ color: 'var(--gray-warm)', fontSize: 14 }}>Gestión de producción y envíos — {orders.length} pedido(s)</p>
      </div>

      {/* Filtro por estado */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('')} style={filterBtn(!filter)}>Todos</button>
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={filterBtn(filter === s)}>{STATUS_LABELS[s]}</button>
        ))}
      </div>

      {error && <p style={{ color: '#c23b3b', marginBottom: 16 }}>{error}</p>}
      {loading && <p style={{ color: 'var(--gray-warm)', marginBottom: 16 }}>Cargando...</p>}

      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--cream-warm)', borderBottom: '1px dashed rgba(212,132,138,.2)' }}>
              {['Pedido', 'Cliente', 'Ciudad', 'Estado', 'Total', 'Abono', 'Fecha', 'Actualizar estado', 'Guía'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const sc = STATUS_COLORS[o.status]
              return (
                <tr key={o.order_number} style={{ borderBottom: '1px dashed rgba(212,132,138,.12)' }}>
                  <td style={tdStyle}><span style={{ fontWeight: 700, color: 'var(--navy)' }}>{o.order_number}</span></td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: 'var(--navy)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-warm)' }}>{o.customer_email}</div>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--gray-warm)' }}>{o.city}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--terracotta)', whiteSpace: 'nowrap' }}>{fmt(o.total_amount)}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmt(o.deposit_amount)}</td>
                  <td style={{ ...tdStyle, color: 'var(--gray-warm)', whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                  <td style={tdStyle}>
                    <select
                      value={o.status}
                      disabled={statusUpdating === o.order_number}
                      onChange={(e) => handleStatusChange(o.order_number, e.target.value)}
                      style={{ background: '#fff', border: '1px solid rgba(27,42,74,.1)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--navy)', fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={trackingInputs[o.order_number] ?? ''}
                        onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [o.order_number]: e.target.value }))}
                        placeholder="Guía..."
                        style={{ width: 90, background: 'var(--cream-warm)', border: '1px solid rgba(27,42,74,.08)', borderRadius: 8, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit' }}
                      />
                      <button onClick={() => handleTrackingUpdate(o.order_number)} style={{ padding: '6px 10px', background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>✓</button>
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
  )
}

const thStyle: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--navy)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '10px 14px' }
function filterBtn(active: boolean): React.CSSProperties {
  return { padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1.5px solid ${active ? 'var(--coral)' : 'rgba(27,42,74,.08)'}`, background: active ? 'var(--coral)' : '#fff', color: active ? '#fff' : 'var(--navy)', cursor: 'pointer', fontFamily: 'inherit' }
}
