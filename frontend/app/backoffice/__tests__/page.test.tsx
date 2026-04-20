import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

import BackofficePage from '../page'
import { useRequireAuth } from '../../../lib/hooks/useRequireAuth'
import { api } from '../../../lib/services/http'
import { orderService } from '../../../lib/services/orderService'

jest.mock('../../../lib/hooks/useRequireAuth', () => ({
  useRequireAuth: jest.fn(),
}))

jest.mock('../../../lib/services/http', () => ({
  api: { get: jest.fn() },
}))

jest.mock('../../../lib/services/orderService', () => ({
  orderService: {
    listOrders: jest.fn(),
    updateStatus: jest.fn(),
    updateTracking: jest.fn(),
  },
}))

const mockUseRequireAuth = useRequireAuth as unknown as jest.Mock
const mockApi = api as jest.Mocked<typeof api>
const mockOrderService = orderService as jest.Mocked<typeof orderService>

describe('BackofficePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOrderService.listOrders.mockResolvedValue([])
    mockApi.get.mockResolvedValue({ data: null })
  })

  it('renders nothing when unauthenticated', () => {
    mockUseRequireAuth.mockReturnValue({ isAuthenticated: false })
    const { container } = render(<BackofficePage />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders loading state while fetching', () => {
    mockUseRequireAuth.mockReturnValue({ isAuthenticated: true })
    mockOrderService.listOrders.mockReturnValue(new Promise(() => {}))

    render(<BackofficePage />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('renders order table after loading', async () => {
    mockUseRequireAuth.mockReturnValue({ isAuthenticated: true })
    mockOrderService.listOrders.mockResolvedValue([
      {
        id: 1,
        order_number: 'PELUCH-20260420-XXXX',
        customer_name: 'María López',
        customer_email: 'maria@example.com',
        city: 'Medellín',
        department: 'Antioquia',
        status: 'payment_confirmed',
        total_amount: 120000,
        deposit_amount: 60000,
        balance_amount: 60000,
        created_at: '2026-04-20T10:00:00Z',
      },
    ])
    mockApi.get.mockResolvedValue({ data: [] })

    render(<BackofficePage />)

    await waitFor(() => {
      expect(screen.getByText('PELUCH-20260420-XXXX')).toBeInTheDocument()
    })
    expect(screen.getByText('María López')).toBeInTheDocument()
  })

  it('renders user table in users tab after clicking tab', async () => {
    mockUseRequireAuth.mockReturnValue({ isAuthenticated: true })
    mockOrderService.listOrders.mockResolvedValue([])
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/users/') return Promise.resolve({ data: [{ id: 1, email: 'admin@example.com', role: 'admin', is_staff: true, is_active: true }] })
      return Promise.resolve({ data: null })
    })

    render(<BackofficePage />)

    // Wait for initial load to finish, then switch to users tab
    await waitFor(() => {
      expect(screen.getByText(/Pedidos/)).toBeInTheDocument()
    })

    const usersTab = screen.getByText(/Usuarios/)
    fireEvent.click(usersTab)

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    })
  })

  it('shows error message when loading fails', async () => {
    mockUseRequireAuth.mockReturnValue({ isAuthenticated: true })
    mockOrderService.listOrders.mockRejectedValue(new Error('Network error'))

    render(<BackofficePage />)

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la información del backoffice.')).toBeInTheDocument()
    })
  })

  it('shows empty state when no orders exist', async () => {
    mockUseRequireAuth.mockReturnValue({ isAuthenticated: true })
    mockOrderService.listOrders.mockResolvedValue([])
    mockApi.get.mockResolvedValue({ data: [] })

    render(<BackofficePage />)

    await waitFor(() => {
      expect(screen.getByText('Sin pedidos')).toBeInTheDocument()
    })
  })
})
