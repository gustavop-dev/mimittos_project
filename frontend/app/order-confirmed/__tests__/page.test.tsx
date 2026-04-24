import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import { Suspense } from 'react'

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}))

jest.mock('@/lib/services/paymentService', () => ({
  paymentService: {
    checkStatus: jest.fn(),
  },
}))

import { useSearchParams } from 'next/navigation'
import OrderConfirmedPage from '../page'

const mockUseSearchParams = useSearchParams as unknown as jest.Mock

describe('OrderConfirmedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders payment confirmed status when confirmed param is set', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => ({ order: 'ORD-001', confirmed: '1', guest: '0', email: '' }[key] ?? null),
    })
    render(<Suspense fallback={null}><OrderConfirmedPage /></Suspense>)
    await waitFor(() => {
      expect(screen.getByText(/Pago confirmado/i)).toBeInTheDocument()
    })
  })

  it('renders "Pago en proceso" heading when confirmed param is absent', () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => ({ order: 'ORD-001', confirmed: null, guest: '0', email: '' }[key] ?? null),
    })
    render(<Suspense fallback={null}><OrderConfirmedPage /></Suspense>)
    expect(screen.getByText(/Pago en proceso/i)).toBeInTheDocument()
  })
})
