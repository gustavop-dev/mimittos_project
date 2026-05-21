import type { OrderItemRead } from '../types'

function snap(item: OrderItemRead, key: string): string {
  const value = item.configuration_snapshot?.[key]
  return typeof value === 'string' ? value : ''
}

export function itemSizeLabel(item: OrderItemRead): string {
  return item.size?.label || snap(item, 'size_label') || '—'
}

export function itemSizeCm(item: OrderItemRead): string {
  return item.size?.cm || snap(item, 'size_cm') || ''
}

export function itemColorName(item: OrderItemRead): string {
  return item.color?.name || snap(item, 'color_name') || '—'
}

export function itemColorHex(item: OrderItemRead): string {
  return item.color?.hex_code || snap(item, 'color_hex') || '#cccccc'
}
