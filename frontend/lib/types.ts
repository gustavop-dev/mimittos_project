// ── Catálogo ──────────────────────────────────────────────────────────────────

export type GlobalSize = {
  id: number
  label: string
  slug: string
  cm: string
  sort_order: number
}

export type GlobalColor = {
  id: number
  name: string
  slug: string
  hex_code: string
  sort_order: number
}

export type Category = {
  id: number
  name: string
  slug: string
  description: string
  display_order: number
  is_active: boolean
}

export type PeluchSizePrice = {
  id: number
  size: GlobalSize
  price: number
  is_available: boolean
}

export type Peluch = {
  id: number
  title: string
  slug: string
  category_name: string
  category_slug: string
  lead_description: string
  badge: 'none' | 'bestseller' | 'new' | 'limited_edition'
  is_featured: boolean
  min_price: number | null
  available_colors: GlobalColor[]
  gallery_urls: string[]
  average_rating: number
  review_count: number
  has_huella: boolean
  has_corazon: boolean
  has_audio: boolean
}

export type PeluchDetail = Peluch & {
  category: Category
  description: string
  specifications: Record<string, string>
  care_instructions: string[]
  size_prices: PeluchSizePrice[]
  view_count: number
  huella_extra_cost: number
  corazon_extra_cost: number
  audio_extra_cost: number
  created_at: string
  updated_at: string
}

// ── Carrito ───────────────────────────────────────────────────────────────────

export type CartItem = {
  peluch_id: number
  peluch_slug: string
  title: string
  size_id: number
  size_label: string
  color_id: number
  color_name: string
  color_hex: string
  unit_price: number
  personalization_cost: number
  quantity: number
  gallery_urls: string[]
  has_huella: boolean
  huella_type: 'name' | 'date' | 'letter' | 'image' | ''
  huella_text: string
  huella_media_id: number | null
  has_corazon: boolean
  corazon_phrase: string
  has_audio: boolean
  audio_media_id: number | null
}

// ── Órdenes ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type OrderListItem = {
  id: number
  order_number: string
  customer_name: string
  customer_email: string
  city: string
  department: string
  status: OrderStatus
  total_amount: number
  deposit_amount: number
  balance_amount: number
  created_at: string
}

export type OrderItemRead = {
  id: number
  peluch_title: string
  peluch_slug: string
  size: GlobalSize
  color: GlobalColor
  quantity: number
  unit_price: number
  personalization_cost: number
  line_total: number
  has_huella: boolean
  huella_type: string
  huella_text: string
  has_corazon: boolean
  corazon_phrase: string
  has_audio: boolean
  configuration_snapshot: Record<string, unknown>
}

export type StatusHistoryEntry = {
  id: number
  previous_status: string
  new_status: string
  changed_by_email: string
  notes: string
  changed_at: string
}

export type WompiPaymentInfo = {
  reference: string
  status: string
  payment_method_type: string
  checkout_url: string
  created_at: string
}

export type OrderDetail = OrderListItem & {
  customer_phone: string
  address: string
  postal_code: string
  tracking_number: string
  shipping_carrier: string
  notes: string
  updated_at: string
  items: OrderItemRead[]
  status_history: StatusHistoryEntry[]
  payment: WompiPaymentInfo | null
}

export type OrderTrackingInfo = {
  order_number: string
  status: OrderStatus
  tracking_number: string
  shipping_carrier: string
  created_at: string
  updated_at: string
  payment_status: string | null
  checkout_url: string | null
}

export type OrderCreateResponse = {
  order_number: string
  checkout_url: string
  deposit_amount: number
  balance_amount: number
  total_amount: number
  is_new_account: boolean
}

// ── Reseñas ───────────────────────────────────────────────────────────────────

export type Review = {
  id: number
  user_email: string
  user_name: string
  rating: number
  comment: string
  created_at: string
}

// ── Media ─────────────────────────────────────────────────────────────────────

export type MediaUploadResponse = {
  media_id: number
  file_url: string
  file_size_kb: number
  duration_sec: number | null
}

// ── Usuarios (auth — sin cambios) ─────────────────────────────────────────────

export type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  is_staff: boolean
}
