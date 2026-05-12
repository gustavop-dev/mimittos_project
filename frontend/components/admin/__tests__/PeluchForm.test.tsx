import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/services/peluchService', () => ({
  peluchService: {
    getCategories: jest.fn(),
    getColors: jest.fn(),
    getSizes: jest.fn(),
  },
}))

jest.mock('@/lib/services/peluchAdminService', () => ({
  peluchAdminService: {
    create: jest.fn(),
    update: jest.fn(),
    getColorImages: jest.fn(),
    uploadColorImage: jest.fn(),
    deleteColorImage: jest.fn(),
  },
}))

jest.mock('@/lib/services/globalPresetService', () => ({
  globalPresetService: {
    createColor: jest.fn(),
    createSize: jest.fn(),
    deleteColor: jest.fn(),
    deleteSize: jest.fn(),
  },
}))

jest.mock('@/lib/utils/imageCompressor', () => ({
  compressImage: jest.fn((file: File) => Promise.resolve(file)),
}))

import { useRouter } from 'next/navigation'
import { peluchService } from '@/lib/services/peluchService'
import { peluchAdminService } from '@/lib/services/peluchAdminService'
import { PeluchForm } from '../PeluchForm'
import type { PeluchDetail } from '@/lib/types'

const mockUseRouter = useRouter as unknown as jest.Mock

const mockCategories = [{ id: 1, name: 'Ositos', slug: 'ositos', description: '', display_order: 1, is_active: true }]
const mockColors = [{ id: 1, name: 'Coral', slug: 'coral', hex_code: '#FF6B6B', sort_order: 1 }]
const mockSizes = [{ id: 1, label: 'S', slug: 's', cm: '20cm', sort_order: 1 }]

const mockExisting: PeluchDetail = {
  id: 1,
  title: 'Osito Coral',
  slug: 'osito-coral',
  category_name: 'Ositos',
  category_slug: 'ositos',
  category: { id: 1, name: 'Ositos', slug: 'ositos', description: '', display_order: 1, is_active: true },
  lead_description: 'El oseznito más querido',
  badge: 'bestseller',
  is_featured: true,
  discount_pct: 0,
  display_order: 100,
  min_price: 85000,
  discounted_min_price: 85000,
  available_colors: [{ id: 1, name: 'Coral', slug: 'coral', hex_code: '#FF6B6B', sort_order: 1 }],
  gallery_urls: [],
  color_images_meta: [],
  average_rating: 4.9,
  review_count: 10,
  has_huella: false,
  has_corazon: false,
  has_audio: false,
  description: ['Párrafo 1'],
  specifications: { Material: 'Felpa' },
  care_instructions: ['Lavar a mano'],
  size_prices: [],
  view_count: 50,
  huella_extra_cost: 0,
  corazon_extra_cost: 0,
  audio_extra_cost: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
}

describe('PeluchForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: jest.fn() })
    ;(peluchService.getCategories as jest.Mock).mockResolvedValue(mockCategories)
    ;(peluchService.getColors as jest.Mock).mockResolvedValue(mockColors)
    ;(peluchService.getSizes as jest.Mock).mockResolvedValue(mockSizes)
  })

  it('renders "Crear peluche" submit button in create mode', async () => {
    render(<PeluchForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Crear peluche' })).toBeInTheDocument()
    })
  })

  it('renders "Guardar cambios" submit button in edit mode', async () => {
    render(<PeluchForm existing={mockExisting} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
    })
  })

  it('populates title field with existing title in edit mode', async () => {
    render(<PeluchForm existing={mockExisting} />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Osito Coral')).toBeInTheDocument()
    })
  })

  it('auto-generates slug from title when not manually set', async () => {
    render(<PeluchForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Crear peluche' })).toBeInTheDocument()
    })
    const titleInput = screen.getByPlaceholderText('Osito Suave Premium')
    await userEvent.type(titleInput, 'Mi Osito')
    await waitFor(() => {
      expect(screen.getByDisplayValue('mi-osito')).toBeInTheDocument()
    })
  })

  it('shows validation error when required fields are empty on submit', async () => {
    render(<PeluchForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Crear peluche' })).toBeInTheDocument()
    })
    const form = screen.getByRole('button', { name: 'Crear peluche' }).closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText('Título, slug y categoría son obligatorios.')).toBeInTheDocument()
    })
  })

  it('shows JSON error when description textarea contains invalid JSON', async () => {
    render(<PeluchForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Crear peluche' })).toBeInTheDocument()
    })
    const descTextarea = screen.getByPlaceholderText(/Párrafo 1 de la descripción/i)
    await userEvent.clear(descTextarea)
    await userEvent.type(descTextarea, 'not valid json')
    await waitFor(() => {
      expect(screen.getByText(/JSON inválido/i)).toBeInTheDocument()
    })
  })

  it('opens color modal when "Añadir nuevo color" button is clicked', async () => {
    render(<PeluchForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Añadir nuevo color/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /Añadir nuevo color/i }))
    await waitFor(() => {
      expect(screen.getByText('Nuevo color')).toBeInTheDocument()
    })
  })

  it('opens size modal when "Añadir nueva talla" button is clicked', async () => {
    render(<PeluchForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Añadir nueva talla/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /Añadir nueva talla/i }))
    await waitFor(() => {
      expect(screen.getByText('Nueva talla')).toBeInTheDocument()
    })
  })

  it('calls peluchAdminService.update when form is submitted in edit mode', async () => {
    const mockPush = jest.fn()
    mockUseRouter.mockReturnValue({ push: mockPush })
    ;(peluchAdminService.update as jest.Mock).mockResolvedValue(mockExisting)

    render(<PeluchForm existing={mockExisting} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => {
      expect(peluchAdminService.update).toHaveBeenCalledWith('osito-coral', expect.any(Object))
    })
  })
})
