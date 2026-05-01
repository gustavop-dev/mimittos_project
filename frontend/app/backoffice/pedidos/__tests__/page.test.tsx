import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('@/lib/services/orderService', () => ({
  orderService: {
    listOrders: jest.fn(),
    updateStatus: jest.fn(),
    updateTracking: jest.fn(),
  },
}))

import { orderService } from '@/lib/services/orderService'
import PedidosAdminPage from '../page'

const mockListOrders = orderService.listOrders as jest.Mock
const mockUpdateStatus = orderService.updateStatus as jest.Mock
const mockUpdateTracking = orderService.updateTracking as jest.Mock

const sampleOrder = {
  order_number: 'MIM-001',
  customer_name: 'María García',
  customer_email: 'maria@example.com',
  city: 'Bogotá',
  status: 'pending_payment' as const,
  total_amount: 250000,
  deposit_amount: 125000,
  created_at: '2026-04-01T10:00:00Z',
}

describe('PedidosAdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListOrders.mockResolvedValue([])
    mockUpdateStatus.mockResolvedValue({})
    mockUpdateTracking.mockResolvedValue({})
  })

  it('renders the Pedidos h1 heading', () => {
    render(<PedidosAdminPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Pedidos' })).toBeInTheDocument()
  })

  it('renders empty table row after orders load', async () => {
    render(<PedidosAdminPage />)
    await waitFor(() => {
      expect(screen.getByText('Sin pedidos')).toBeInTheDocument()
    })
  })

  it('shows the error message when listOrders rejects', async () => {
    mockListOrders.mockRejectedValueOnce(new Error('boom'))
    render(<PedidosAdminPage />)
    await waitFor(() => {
      expect(screen.getByText(/No se pudieron cargar los pedidos/i)).toBeInTheDocument()
    })
  })

  it('renders one row per order returned by the service', async () => {
    mockListOrders.mockResolvedValueOnce([sampleOrder])
    render(<PedidosAdminPage />)
    await waitFor(() => {
      expect(screen.getByText('MIM-001')).toBeInTheDocument()
    })
    expect(screen.getByText('María García')).toBeInTheDocument()
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })

  it('refetches with status filter when a filter button is clicked', async () => {
    render(<PedidosAdminPage />)
    await waitFor(() => expect(mockListOrders).toHaveBeenCalledWith(undefined))

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'En producción' }))

    await waitFor(() => expect(mockListOrders).toHaveBeenCalledWith({ status: 'in_production' }))
  })

  it('updates the order status optimistically when the select changes', async () => {
    mockListOrders.mockResolvedValueOnce([sampleOrder])
    const user = userEvent.setup()
    render(<PedidosAdminPage />)

    await waitFor(() => expect(screen.getByText('MIM-001')).toBeInTheDocument())

    const statusSelect = screen.getByRole('combobox') as HTMLSelectElement
    await user.selectOptions(statusSelect, 'shipped')

    await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalledWith('MIM-001', 'shipped'))
  })

  it('submits the tracking number when the confirm button is clicked', async () => {
    mockListOrders.mockResolvedValueOnce([sampleOrder])
    const user = userEvent.setup()
    render(<PedidosAdminPage />)

    const trackingInput = await screen.findByPlaceholderText('Guía...')
    await user.type(trackingInput, 'GUIA-7777')
    await user.click(screen.getByRole('button', { name: '✓' }))

    await waitFor(() => expect(mockUpdateTracking).toHaveBeenCalledWith('MIM-001', 'GUIA-7777'))
  })

  it('does not submit tracking when the input is empty', async () => {
    mockListOrders.mockResolvedValueOnce([sampleOrder])
    const user = userEvent.setup()
    render(<PedidosAdminPage />)

    await waitFor(() => expect(screen.getByText('MIM-001')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '✓' }))

    expect(mockUpdateTracking).not.toHaveBeenCalled()
  })

  it('alerts when updateStatus rejects', async () => {
    mockListOrders.mockResolvedValueOnce([sampleOrder])
    mockUpdateStatus.mockRejectedValueOnce(new Error('nope'))
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<PedidosAdminPage />)

    await waitFor(() => expect(screen.getByText('MIM-001')).toBeInTheDocument())
    await user.selectOptions(screen.getByRole('combobox'), 'cancelled')

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('No se pudo actualizar el estado.'))
    alertSpy.mockRestore()
  })

  it('alerts when updateTracking rejects', async () => {
    mockListOrders.mockResolvedValueOnce([sampleOrder])
    mockUpdateTracking.mockRejectedValueOnce(new Error('nope'))
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<PedidosAdminPage />)

    const trackingInput = await screen.findByPlaceholderText('Guía...')
    await user.type(trackingInput, 'X-1')
    await user.click(screen.getByRole('button', { name: '✓' }))

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('No se pudo actualizar la guía.'))
    alertSpy.mockRestore()
  })
})
