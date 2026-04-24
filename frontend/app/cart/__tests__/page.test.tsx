import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'

jest.mock('@/lib/stores/cartStore', () => ({
  useCartStore: jest.fn(),
  calcDeposit: jest.fn((total: number) => Math.ceil(total * 0.5)),
  lineTotal: jest.fn((item: { unit_price: number; quantity: number }) => item.unit_price * item.quantity),
}))

import { useCartStore } from '@/lib/stores/cartStore'
import CartPage from '../page'

const mockUseCartStore = useCartStore as unknown as jest.Mock

describe('CartPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty cart state with catalog link when cart is empty', () => {
    mockUseCartStore.mockImplementation((selector: (s: { items: [] }) => unknown) =>
      selector({ items: [] })
    )
    render(<CartPage />)
    expect(screen.getByRole('link', { name: /Ver catálogo/i })).toBeInTheDocument()
  })

  it('renders checkout link when cart has items', () => {
    mockUseCartStore.mockImplementation(
      (selector: (s: { items: { peluch_id: number; title: string; quantity: number; unit_price: number; size_label: string; color_name: string; color_hex: string; gallery_urls: string[]; has_huella: boolean; has_corazon: boolean; has_audio: boolean; personalization_cost: number }[]; removeFromCart: jest.Mock; updateQuantity: jest.Mock }) => unknown) =>
        selector({
          items: [{
            peluch_id: 1, title: 'Osito Coral', quantity: 1,
            unit_price: 85000, size_label: 'S', color_name: 'Rosa', color_hex: '#FF69B4',
            gallery_urls: [], has_huella: false, has_corazon: false, has_audio: false, personalization_cost: 0,
          }],
          removeFromCart: jest.fn(),
          updateQuantity: jest.fn(),
        })
    )
    render(<CartPage />)
    expect(screen.getByText('Osito Coral')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir a pagar/i })).toBeInTheDocument()
  })
})
