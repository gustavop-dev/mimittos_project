import { itemSizeLabel, itemSizeCm, itemColorName, itemColorHex } from '../orderItemDisplay'
import type { OrderItemRead } from '../../types'

const baseItem = {
  id: 1, peluch_title: 'Osito', peluch_slug: 'osito', quantity: 1, unit_price: 1000,
  personalization_cost: 0, line_total: 1000, has_huella: false, huella_type: '',
  huella_text: '', huella_media_url: null, has_corazon: false, corazon_phrase: '',
  has_audio: false, audio_media_url: null, audio_duration_sec: null, audio_size_kb: null,
} as const

it('uses the live FK when size is present', () => {
  const item = {
    ...baseItem,
    size: { id: 1, label: 'Mediano', slug: 'mediano', cm: '35cm', sort_order: 1 },
    color: { id: 1, name: 'Rubí rojo', slug: 'rubi-rojo', hex_code: '#C0182B', sort_order: 1 },
    configuration_snapshot: {},
  } as OrderItemRead
  expect(itemSizeLabel(item)).toBe('Mediano')
  expect(itemColorName(item)).toBe('Rubí rojo')
})

it('falls back to the snapshot when the size FK is null', () => {
  const item = {
    ...baseItem,
    size: null,
    color: null,
    configuration_snapshot: { size_label: 'Mediano', size_cm: '35cm', color_name: 'Rubí rojo', color_hex: '#C0182B' },
  } as OrderItemRead
  expect(itemSizeLabel(item)).toBe('Mediano')
  expect(itemSizeCm(item)).toBe('35cm')
  expect(itemColorName(item)).toBe('Rubí rojo')
  expect(itemColorHex(item)).toBe('#C0182B')
})

it('returns a dash when neither FK nor snapshot has the value', () => {
  const item = { ...baseItem, size: null, color: null, configuration_snapshot: {} } as OrderItemRead
  expect(itemSizeLabel(item)).toBe('—')
  expect(itemColorName(item)).toBe('—')
})
