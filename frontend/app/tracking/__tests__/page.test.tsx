import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('@/lib/services/orderService', () => ({
  orderService: { trackOrder: jest.fn() },
}))

import { useSearchParams } from 'next/navigation'
import TrackingPage from '../page'

const mockUseSearchParams = useSearchParams as unknown as jest.Mock

describe('TrackingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSearchParams.mockReturnValue({ get: () => null })
  })

  it('renders the tracking search input', () => {
    render(<Suspense fallback={null}><TrackingPage /></Suspense>)
    expect(screen.getByPlaceholderText(/PELUCH-20260420-XXXX/i)).toBeInTheDocument()
  })

  it('renders the Seguimiento section heading', () => {
    render(<Suspense fallback={null}><TrackingPage /></Suspense>)
    expect(screen.getByText('Seguimiento')).toBeInTheDocument()
  })
})
