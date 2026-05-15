import { describe, it, expect, beforeEach } from '@jest/globals'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import CheckoutPage from '../page'
import { useCartStore } from '../../../lib/stores/cartStore'
import { orderService } from '../../../lib/services/orderService'

jest.mock('../../../lib/stores/cartStore', () => ({
  useCartStore: jest.fn(),
  lineTotal: jest.fn((item: any) => (item.unit_price + item.personalization_cost) * item.quantity),
  calcDeposit: jest.fn(() => 0),
  calcShipping: jest.fn(() => 0),
  calcFullPaymentDiscount: jest.fn(() => 0),
  calcAmountToPayNow: jest.fn(() => 0),
  calcBalanceAtDelivery: jest.fn(() => 0),
}))

jest.mock('../../../lib/services/orderService', () => ({
  orderService: { createOrder: jest.fn() },
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

const mockUseCartStore = useCartStore as unknown as jest.Mock
const mockOrderService = orderService as jest.Mocked<typeof orderService>

const peluchItem = {
  peluch_id: 1, peluch_slug: 'osito-coral', title: 'Osito Coral',
  size_id: 2, size_label: 'Mediano',
  color_id: 1, color_name: 'Rosa Coral', color_hex: '#D4848A',
  unit_price: 128000, personalization_cost: 0, quantity: 1,
  gallery_urls: ['http://example.com/img.jpg'],
  has_huella: false, huella_type: '', huella_text: '', huella_media_id: null,
  has_corazon: false, corazon_phrase: '',
  has_audio: false, audio_media_id: null,
}

const setCartState = (state: any) => {
  mockUseCartStore.mockImplementation((selector: (store: any) => unknown) => selector(state))
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty cart message when cart is empty', async () => {
    setCartState({ items: [], clearCart: jest.fn() })
    render(<CheckoutPage />)
    await waitFor(() => {
      expect(screen.getByText(/Tu carrito está vacío/)).toBeInTheDocument()
    })
  })

  it('disables submit button when cart is empty', async () => {
    setCartState({ items: [], clearCart: jest.fn() })
    render(<CheckoutPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ir a pagar/i })).toBeDisabled()
    })
  })

  it('disables submit button when terms not accepted', async () => {
    setCartState({ items: [peluchItem], clearCart: jest.fn() })
    render(<CheckoutPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ir a pagar/i })).toBeDisabled()
    })
  })

  it('shows item title in order summary', async () => {
    setCartState({ items: [peluchItem], clearCart: jest.fn() })
    render(<CheckoutPage />)
    await waitFor(() => {
      expect(screen.getByText('Osito Coral')).toBeInTheDocument()
    })
  })

  it('enables submit button after accepting terms', async () => {
    setCartState({ items: [peluchItem], clearCart: jest.fn() })
    render(<CheckoutPage />)

    await waitFor(() => expect(screen.getByRole('checkbox')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('checkbox'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ir a pagar/i })).not.toBeDisabled()
    })
  })

  it('calls orderService.createOrder on successful submission', async () => {
    const clearCart = jest.fn()
    setCartState({ items: [peluchItem], clearCart })
    mockOrderService.createOrder.mockResolvedValueOnce({
      order_number: 'PELUCH-001',
      deposit_amount: 64000,
      balance_amount: 64000,
      shipping_amount: 0,
      discount_amount: 0,
      payment_mode: 'deposit',
      amount_paid_now: 64000,
      total_amount: 128000,
      is_guest: false,
    })

    jest.spyOn(HTMLFormElement.prototype, 'checkValidity').mockReturnValue(true)
    jest.spyOn(HTMLFormElement.prototype, 'reportValidity').mockReturnValue(true)

    render(<CheckoutPage />)

    await waitFor(() => expect(screen.getByRole('checkbox')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(screen.getByRole('button', { name: /Ir a pagar/i })).not.toBeDisabled())

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Ir a pagar/i }).closest('form')!)
    })

    await waitFor(() => {
      expect(mockOrderService.createOrder).toHaveBeenCalledTimes(1)
    })

    jest.restoreAllMocks()
  })

  it('shows error message when order creation fails', async () => {
    setCartState({ items: [peluchItem], clearCart: jest.fn() })
    mockOrderService.createOrder.mockRejectedValueOnce({
      response: { data: { detail: 'Stock insuficiente' } },
    })

    jest.spyOn(HTMLFormElement.prototype, 'checkValidity').mockReturnValue(true)
    jest.spyOn(HTMLFormElement.prototype, 'reportValidity').mockReturnValue(true)

    render(<CheckoutPage />)

    await waitFor(() => expect(screen.getByRole('checkbox')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(screen.getByRole('button', { name: /Ir a pagar/i })).not.toBeDisabled())

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Ir a pagar/i }).closest('form')!)
    })

    expect(await screen.findByText('Stock insuficiente')).toBeInTheDocument()
    jest.restoreAllMocks()
  })
})
