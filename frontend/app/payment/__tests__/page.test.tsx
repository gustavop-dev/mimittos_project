import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import { Suspense } from 'react'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(),
}))

jest.mock('@/lib/services/paymentService', () => ({
  paymentService: {
    getInfo: jest.fn(),
    getAcceptanceTokens: jest.fn(),
    getPseBanks: jest.fn(),
    processCard: jest.fn(),
    processNequi: jest.fn(),
    processPse: jest.fn(),
    processBancolombia: jest.fn(),
    tokenizeCard: jest.fn(),
    pollStatus: jest.fn(),
    checkStatus: jest.fn(),
  },
}))

import { useSearchParams } from 'next/navigation'
import { paymentService } from '@/lib/services/paymentService'
import PaymentPage from '../page'

const mockUseSearchParams = useSearchParams as unknown as jest.Mock
const mockGetInfo = paymentService.getInfo as jest.Mock
const mockGetAcceptanceTokens = paymentService.getAcceptanceTokens as jest.Mock
const mockGetPseBanks = paymentService.getPseBanks as jest.Mock

const mockPaymentInfo = {
  order_number: 'ORD-001',
  reference: 'REF-001',
  amount_in_cents: 12800000,
  currency: 'COP',
  total_amount: 128000,
  deposit_amount: 64000,
  balance_amount: 64000,
  customer_name: 'Ana García',
  customer_email: 'ana@test.com',
  customer_phone: '3001234567',
  status: 'pending',
}

describe('PaymentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSearchParams.mockReturnValue({ get: (key: string) => key === 'order' ? 'ORD-001' : null })
    mockGetInfo.mockResolvedValue(mockPaymentInfo)
    mockGetAcceptanceTokens.mockResolvedValue({
      acceptance_token: 'tok-acc',
      acceptance_permalink: 'https://wompi.co/terms',
      personal_auth_token: 'tok-personal',
    })
    mockGetPseBanks.mockResolvedValue([])
  })

  it('renders payment method selector after order info loads', async () => {
    render(<Suspense fallback={null}><PaymentPage /></Suspense>)
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument()
    })
  })

  it('renders Wompi security text', () => {
    render(<Suspense fallback={null}><PaymentPage /></Suspense>)
    expect(screen.getByText(/Pago seguro · Wompi/i)).toBeInTheDocument()
  })
})
