import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import type { PeluchDetail } from '@/lib/types'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

jest.mock('@/components/admin/PeluchForm', () => ({
  PeluchForm: ({ existing }: { existing?: PeluchDetail }) => (
    <div data-testid="peluch-form" data-mode={existing ? 'edit' : 'create'} data-title={existing?.title ?? ''} />
  ),
}))

const mockGetPeluchBySlug = jest.fn()
jest.mock('@/lib/services/peluchService', () => ({
  peluchService: { getPeluchBySlug: (...args: unknown[]) => mockGetPeluchBySlug(...args) },
}))

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  use: (promise: Promise<{ slug: string }>) => {
    // In tests we resolve params synchronously via the mock below
    if (promise && typeof (promise as unknown as { slug: string }).slug === 'string') {
      return promise
    }
    return { slug: 'osito-test' }
  },
}))

import EditarPeluchPage from '../page'

const mockPeluch: PeluchDetail = {
  id: 1,
  title: 'Osito Test',
  slug: 'osito-test',
  lead_description: 'Un osito adorable',
  description: [],
  specifications: {},
  care_instructions: [],
  badge: 'none',
  is_active: true,
  is_featured: false,
  discount_pct: 0,
  display_order: 1,
  average_rating: '5.00',
  review_count: 0,
  view_count: 0,
  has_huella: false,
  has_corazon: false,
  has_audio: false,
  huella_extra_cost: 0,
  corazon_extra_cost: 0,
  audio_extra_cost: 0,
  gallery_urls: [],
  size_prices: [],
  available_colors: [],
  color_images: [],
  category: { id: 1, name: 'Osos', slug: 'osos', description: '', display_order: 0, is_active: true, is_featured: false, image_url: null },
}

describe('EditarPeluchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state while fetching peluch', () => {
    mockGetPeluchBySlug.mockReturnValue(new Promise(() => {}))
    render(<EditarPeluchPage params={Promise.resolve({ slug: 'osito-test' })} />)
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument()
  })

  it('shows not found message when peluch fetch fails', async () => {
    mockGetPeluchBySlug.mockRejectedValue(new Error('Not found'))
    render(<EditarPeluchPage params={Promise.resolve({ slug: 'no-existe' })} />)
    await waitFor(() => {
      expect(screen.getByText(/no encontrado/i)).toBeInTheDocument()
    })
  })

  it('renders edit heading with peluch title after successful fetch', async () => {
    mockGetPeluchBySlug.mockResolvedValue(mockPeluch)
    render(<EditarPeluchPage params={Promise.resolve({ slug: 'osito-test' })} />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Editar: Osito Test/i })).toBeInTheDocument()
    })
  })

  it('renders PeluchForm in edit mode with existing peluch data', async () => {
    mockGetPeluchBySlug.mockResolvedValue(mockPeluch)
    render(<EditarPeluchPage params={Promise.resolve({ slug: 'osito-test' })} />)
    await waitFor(() => {
      const form = screen.getByTestId('peluch-form')
      expect(form).toHaveAttribute('data-mode', 'edit')
      expect(form).toHaveAttribute('data-title', 'Osito Test')
    })
  })

  it('renders back link to /backoffice/peluches', async () => {
    mockGetPeluchBySlug.mockResolvedValue(mockPeluch)
    render(<EditarPeluchPage params={Promise.resolve({ slug: 'osito-test' })} />)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Volver a peluches/i })
      expect(link).toHaveAttribute('href', '/backoffice/peluches')
    })
  })
})
