import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('@/lib/services/peluchService', () => ({
  peluchService: {
    listPeluches: jest.fn(),
    getCategories: jest.fn(),
  },
}))

jest.mock('@/lib/services/peluchAdminService', () => ({
  peluchAdminService: {
    delete: jest.fn(),
    bulkUpdateCategory: jest.fn(),
  },
}))

import { peluchService } from '@/lib/services/peluchService'
import PeluchesAdminPage from '../page'

const mockListPeluches = peluchService.listPeluches as jest.Mock
const mockGetCategories = peluchService.getCategories as jest.Mock

const basePeluch = {
  id: 1,
  title: 'Osito Test',
  slug: 'osito-test',
  category_name: 'Clásicos',
  category_slug: 'clasicos',
  lead_description: 'Un osito de prueba',
  badge: 'none' as const,
  is_active: true,
  is_featured: false,
  discount_pct: 0,
  display_order: 1,
  min_price: 50000,
  discounted_min_price: null,
  available_colors: [],
  gallery_urls: [],
  average_rating: 0,
  review_count: 0,
  has_huella: false,
  has_corazon: false,
  has_audio: false,
}

describe('PeluchesAdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListPeluches.mockResolvedValue([])
    mockGetCategories.mockResolvedValue([])
  })

  it('renders the Peluches h1 heading', () => {
    render(<PeluchesAdminPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Peluches' })).toBeInTheDocument()
  })

  it('renders the new peluche link after data loads', async () => {
    render(<PeluchesAdminPage />)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Nuevo peluche/i })).toHaveAttribute('href', '/backoffice/peluches/nuevo')
    })
  })

  it('shows a Borrador badge for an inactive peluche', async () => {
    mockListPeluches.mockResolvedValue([{ ...basePeluch, is_active: false }])
    render(<PeluchesAdminPage />)
    expect(await screen.findByText('Borrador')).toBeInTheDocument()
  })
})
