import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

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

describe('PedidosAdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListOrders.mockResolvedValue([])
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
})
