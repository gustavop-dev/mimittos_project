import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

import CatalogPage from '../page'
import { peluchService } from '../../../lib/services/peluchService'

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
    is_featured: true, discount_pct: 0, display_order: 100,
    min_price: 85000, discounted_min_price: 85000,
    available_colors: [], gallery_urls: [], color_images_meta: [],
    average_rating: 4.9, review_count: 10,
    has_huella: true, has_corazon: true, has_audio: false,
  },
  {
    id: 2, title: 'Conejito Lucía', slug: 'conejito-lucia',
    category_name: 'Conejitos', category_slug: 'conejitos',
    lead_description: '', badge: 'new' as const,
    is_featured: false, discount_pct: 0, display_order: 100,
    min_price: 95000, discounted_min_price: 95000,
    available_colors: [], gallery_urls: [], color_images_meta: [],
    average_rating: 4.7, review_count: 5,
    has_huella: false, has_corazon: true, has_audio: false,
  },
]

describe('CatalogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
})
