import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import ProductDetailPage from '../page'
import { useCartStore } from '../../../../lib/stores/cartStore'

jest.mock('../../../../lib/stores/cartStore', () => ({
  useCartStore: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ productId: '1' })),
}))

const mockUseCartStore = useCartStore as unknown as jest.Mock

describe('ProductDetailPage (legacy static page)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCartStore.mockImplementation((selector: (s: any) => unknown) =>
      selector({ addToCart: jest.fn(), items: [] })
    )
  })

  it('renders the page without crashing', () => {
    const { container } = render(<ProductDetailPage />)
    expect(container).not.toBeEmptyDOMElement()
  })

  it('renders size options', () => {
    render(<ProductDetailPage />)
    expect(screen.getByText('Pequeño')).toBeInTheDocument()
    expect(screen.getByText('Mediano')).toBeInTheDocument()
  })

  it('renders add to cart button', () => {
    render(<ProductDetailPage />)
    expect(screen.getByRole('button', { name: /Agregar/i })).toBeInTheDocument()
  })
})
