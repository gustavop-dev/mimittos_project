import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('@/lib/hooks/useRequireAuth', () => ({
  useRequireAuth: jest.fn(),
}))

jest.mock('@/lib/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}))

jest.mock('@/lib/services/orderService', () => ({
  orderService: { getMyOrders: jest.fn() },
}))

import { useAuthStore } from '@/lib/stores/authStore'
import { orderService } from '@/lib/services/orderService'
import OrdersPage from '../page'

const mockUseAuthStore = useAuthStore as jest.Mock
const mockGetMyOrders = orderService.getMyOrders as jest.Mock

describe('OrdersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuthStore.mockReturnValue({ user: { first_name: 'Ana', last_name: 'García', email: 'ana@test.com' }, signOut: jest.fn() })
    mockGetMyOrders.mockResolvedValue([])
  })

  it('renders the personalized greeting with user first name', async () => {
    render(<OrdersPage />)
    await waitFor(() => {
      expect(screen.getByText(/Hola, Ana/i)).toBeInTheDocument()
    })
  })

  it('renders empty orders state after data loads', async () => {
    render(<OrdersPage />)
    await waitFor(() => {
      expect(screen.getByText(/Aún no tienes pedidos/i)).toBeInTheDocument()
    })
  })
})
