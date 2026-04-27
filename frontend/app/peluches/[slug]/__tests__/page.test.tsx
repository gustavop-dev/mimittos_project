import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

import PeluchDetailPage from '../page'
import { peluchService } from '../../../../lib/services/peluchService'
import { useCartStore } from '../../../../lib/stores/cartStore'

jest.mock('../../../../lib/services/peluchService', () => ({
  peluchService: {
    getPeluchBySlug: jest.fn(),
    getReviews: jest.fn(),
    getColorImages: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../../../../lib/services/mediaService', () => ({
  mediaService: { uploadImage: jest.fn(), uploadAudio: jest.fn() },
}))

jest.mock('../../../../lib/stores/cartStore', () => ({
  useCartStore: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ slug: 'osito-coral' })),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/peluches/osito-coral'),
}))

const mockPeluchService = peluchService as jest.Mocked<typeof peluchService>
const mockUseCartStore = useCartStore as unknown as jest.Mock

const mockPeluchDetail = {
  id: 1, title: 'Osito Coral', slug: 'osito-coral',
  category_name: 'Osito clásico', category_slug: 'osito-clasico',
  category: { id: 1, name: 'Osito clásico', slug: 'osito-clasico', description: '', display_order: 1, is_active: true, is_featured: false, image_url: null },
  lead_description: 'El oseznito más querido',
  description: ['Un osito adorable hecho a mano'],
  badge: 'bestseller' as const,
  is_featured: true,
  discount_pct: 0,
  display_order: 100,
  min_price: 85000,
  discounted_min_price: 85000,
  available_colors: [{ id: 1, name: 'Rosa Coral', slug: 'rosa-coral', hex_code: '#D4848A', sort_order: 1 }],
  gallery_urls: ['http://example.com/img1.jpg', 'http://example.com/img2.jpg'],
  color_images_meta: [],
  average_rating: 4.9, review_count: 184,
  has_huella: true, has_corazon: true, has_audio: false,
  size_prices: [
    { id: 1, size: { id: 1, label: 'Pequeño', slug: 'pequeno', cm: '20cm', sort_order: 1 }, price: 85000, is_available: true },
    { id: 2, size: { id: 2, label: 'Mediano', slug: 'mediano', cm: '35cm', sort_order: 2 }, price: 128000, is_available: true },
  ],
  specifications: { material: 'Algodón 100%', relleno: 'Fibra hipoalergénica' },
  care_instructions: ['Lavar a mano', 'No exponer al sol'],
  view_count: 512,
  huella_extra_cost: 15000, corazon_extra_cost: 10000, audio_extra_cost: 20000,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
}

describe('PeluchDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCartStore.mockImplementation((selector: (s: any) => unknown) =>
      selector({ addToCart: jest.fn(), items: [] })
    )
    mockPeluchService.getReviews.mockResolvedValue([])
  })

  it('renders loading state initially', () => {
    mockPeluchService.getPeluchBySlug.mockReturnValue(new Promise(() => {}))
    render(<PeluchDetailPage />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('renders peluch title after loading', async () => {
    mockPeluchService.getPeluchBySlug.mockResolvedValue(mockPeluchDetail)
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Osito Coral' })).toBeInTheDocument()
    })
  })

  it('renders bestseller badge', async () => {
    mockPeluchService.getPeluchBySlug.mockResolvedValue(mockPeluchDetail)
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Más vendido')).toBeInTheDocument()
    })
  })

  it('renders size options from size_prices', async () => {
    mockPeluchService.getPeluchBySlug.mockResolvedValue(mockPeluchDetail)
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Pequeño')).toBeInTheDocument()
      expect(screen.getByText('Mediano')).toBeInTheDocument()
    })
  })

  it('renders color section header', async () => {
    mockPeluchService.getPeluchBySlug.mockResolvedValue(mockPeluchDetail)
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Color del peluche')).toBeInTheDocument()
    })
  })

  it('renders huella personalization section when has_huella is true', async () => {
    mockPeluchService.getPeluchBySlug.mockResolvedValue(mockPeluchDetail)
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.getByText(/Huella/i)).toBeInTheDocument()
    })
  })

  it('renders corazón personalization section when has_corazon is true', async () => {
    mockPeluchService.getPeluchBySlug.mockResolvedValue(mockPeluchDetail)
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.getByText(/Corazón/i)).toBeInTheDocument()
    })
  })

  it('does not render audio section when has_audio is false', async () => {
    mockPeluchService.getPeluchBySlug.mockResolvedValue(mockPeluchDetail)
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.queryByText(/Audio personalizado/i)).not.toBeInTheDocument()
    })
  })

  it('renders audio section when has_audio is true', async () => {
    const withAudio = { ...mockPeluchDetail, has_audio: true }
    mockPeluchService.getPeluchBySlug.mockResolvedValue(withAudio)
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.getByText(/Audio personalizado/i)).toBeInTheDocument()
    })
  })

  it('renders error message when peluch fetch fails', async () => {
    mockPeluchService.getPeluchBySlug.mockRejectedValue(new Error('Network error'))
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('No encontramos este peluche.')).toBeInTheDocument()
    })
  })

  it('renders add to cart button', async () => {
    mockPeluchService.getPeluchBySlug.mockResolvedValue(mockPeluchDetail)
    render(<PeluchDetailPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Agregar/i })).toBeInTheDocument()
    })
  })
})
