import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CatalogPage from '../page'
import { peluchService } from '../../../lib/services/peluchService'

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('../../../lib/services/peluchService', () => ({
  peluchService: {
    listPeluches: jest.fn(),
    getCategories: jest.fn(),
    getSizes: jest.fn(),
  },
}))

const mockPeluchService = peluchService as jest.Mocked<typeof peluchService>

const mockPeluches = [
  {
    id: 1, title: 'Osito Coral', slug: 'osito-coral',
    category_name: 'Ositos', category_slug: 'ositos',
    lead_description: '', badge: 'bestseller' as const,
    is_active: true, is_featured: true, discount_pct: 0, display_order: 100,
    min_price: 85000, discounted_min_price: 85000,
    available_colors: [], gallery_urls: [],
    average_rating: 4.9, review_count: 10,
    has_huella: true, has_corazon: true, has_audio: false,
    deposit_percentage: 50, full_payment_discount_pct: 0, free_shipping: false, shipping_cost: 0,
  },
  {
    id: 2, title: 'Conejito Lucía', slug: 'conejito-lucia',
    category_name: 'Conejitos', category_slug: 'conejitos',
    lead_description: '', badge: 'new' as const,
    is_active: true, is_featured: false, discount_pct: 0, display_order: 100,
    min_price: 95000, discounted_min_price: 95000,
    available_colors: [], gallery_urls: [],
    average_rating: 4.7, review_count: 5,
    has_huella: false, has_corazon: true, has_audio: false,
    deposit_percentage: 50, full_payment_discount_pct: 0, free_shipping: false, shipping_cost: 0,
  },
]

const createPeluch = (id: number) => ({
  ...mockPeluches[0],
  id,
  title: `Peluche ${id}`,
  slug: `peluche-${id}`,
})

const manyPeluches = (count: number) => Array.from({ length: count }, (_, i) => createPeluch(i + 1))

function mockDesktopViewport() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  })
}

describe('CatalogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete (window as any).matchMedia
    window.scrollTo = jest.fn()
    mockPeluchService.getCategories.mockResolvedValue([])
    mockPeluchService.getSizes.mockResolvedValue([])
  })

  it('renders catalog heading', async () => {
    mockPeluchService.listPeluches.mockResolvedValue([])
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Descubre el peluche/i })).toBeInTheDocument()
    })
  })

  it('shows loading state before fetch resolves', () => {
    mockPeluchService.listPeluches.mockReturnValue(new Promise(() => {}))
    render(<CatalogPage />)
    expect(screen.getByText('Cargando peluches...')).toBeInTheDocument()
  })

  it('calls listPeluches on mount', async () => {
    mockPeluchService.listPeluches.mockResolvedValue([])
    render(<CatalogPage />)
    await waitFor(() => {
      expect(mockPeluchService.listPeluches).toHaveBeenCalledTimes(1)
    })
  })

  it('renders empty state when no peluches match', async () => {
    mockPeluchService.listPeluches.mockResolvedValue([])
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Sin peluches en esta búsqueda')).toBeInTheDocument()
    })
  })

  it('renders peluch cards when data is available', async () => {
    mockPeluchService.listPeluches.mockResolvedValue(mockPeluches)
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Osito Coral')).toBeInTheDocument()
      expect(screen.getByText('Conejito Lucía')).toBeInTheDocument()
    })
  })

  it('hides pagination when results fit on one page', async () => {
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(12))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Peluche 12')).toBeInTheDocument()
    })
    expect(screen.queryByRole('navigation', { name: /paginación/i })).not.toBeInTheDocument()
  })

  it('shows pagination controls when results exceed the mobile page size', async () => {
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(13))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /paginación/i })).toBeInTheDocument()
    })
  })

  it('renders only 12 cards on the first mobile page', async () => {
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(13))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Peluche 12')).toBeInTheDocument()
    })
    expect(screen.queryByText('Peluche 13')).not.toBeInTheDocument()
  })

  it('shows the remaining cards after navigating to the next page', async () => {
    const user = userEvent.setup()
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(13))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Peluche 12')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /página siguiente/i }))

    expect(screen.getByText('Peluche 13')).toBeInTheDocument()
    expect(screen.queryByText('Peluche 1', { exact: true })).not.toBeInTheDocument()
  })

  it('renders 16 cards on the first desktop page', async () => {
    mockDesktopViewport()
    mockPeluchService.listPeluches.mockResolvedValue(manyPeluches(17))
    render(<CatalogPage />)
    await waitFor(() => {
      expect(screen.getByText('Peluche 16')).toBeInTheDocument()
    })
    expect(screen.queryByText('Peluche 17')).not.toBeInTheDocument()
  })
})
