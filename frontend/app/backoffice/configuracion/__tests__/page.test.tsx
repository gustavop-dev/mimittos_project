import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('@/lib/services/contentService', () => ({
  contentService: {
    get: jest.fn(),
    update: jest.fn(),
    uploadHeroImage: jest.fn(),
  },
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill: _f, unoptimized: _u, ...rest } = props
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />
  },
}))

import { contentService } from '@/lib/services/contentService'
import ConfiguracionPage from '../page'

const mockGet = contentService.get as jest.Mock
const mockUpdate = contentService.update as jest.Mock
const mockUpload = contentService.uploadHeroImage as jest.Mock

describe('ConfiguracionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    if (typeof URL.createObjectURL === 'undefined') {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: jest.fn(() => 'blob:preview'),
      })
    }
  })

  it('renders the section heading', async () => {
    mockGet.mockResolvedValue({ content_json: {} })
    render(<ConfiguracionPage />)
    expect(screen.getByRole('heading', { level: 1, name: /Ajustes generales/i })).toBeInTheDocument()
  })

  it('loads the existing banner state from the content API', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'promo_banner') {
        return Promise.resolve({
          content_json: { is_active: true, message: '¡Envío gratis!', bg_color: '#1B2A4A', text_color: '#fff' },
        })
      }
      return Promise.resolve({ content_json: {} })
    })

    render(<ConfiguracionPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('¡Envío gratis!')).toBeInTheDocument()
    })
    expect(screen.getByText(/Cinta activa/i)).toBeInTheDocument()
  })

  it('loads an existing hero image preview when the API returns an image_url', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'hero_image') {
        return Promise.resolve({ content_json: { image_url: 'https://example.com/hero.jpg' } })
      }
      return Promise.resolve({ content_json: {} })
    })

    render(<ConfiguracionPage />)

    await waitFor(() => {
      expect(screen.getByAltText('Hero preview')).toHaveAttribute('src', 'https://example.com/hero.jpg')
    })
  })

  it('toggles the banner active label when the switch is clicked', async () => {
    mockGet.mockResolvedValue({ content_json: {} })
    const user = userEvent.setup()
    render(<ConfiguracionPage />)

    await screen.findByText(/Cinta desactivada/i)
    const toggleSwitch = screen.getByTestId('banner-toggle')
    await user.click(toggleSwitch)

    expect(screen.getByText(/Cinta activa — visible/i)).toBeInTheDocument()
  })

  it('saves the banner configuration with the typed message', async () => {
    mockGet.mockResolvedValue({ content_json: {} })
    mockUpdate.mockResolvedValue({})
    const user = userEvent.setup()
    render(<ConfiguracionPage />)

    const messageInput = await screen.findByPlaceholderText(/Envío gratis/i)
    await user.type(messageInput, 'Promo activa')
    await user.click(screen.getByRole('button', { name: /Guardar cinta/i }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('promo_banner', expect.objectContaining({ message: 'Promo activa' }))
    })
  })

  it('shows the success label after the banner save resolves', async () => {
    mockGet.mockResolvedValue({ content_json: {} })
    mockUpdate.mockResolvedValue({})
    const user = userEvent.setup()
    render(<ConfiguracionPage />)

    const saveBtn = await screen.findByRole('button', { name: /Guardar cinta/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Guardado/i })).toBeInTheDocument()
    })
  })

  it('shows the upload error when uploadHeroImage rejects', async () => {
    mockGet.mockResolvedValue({ content_json: {} })
    mockUpload.mockRejectedValue(new Error('boom'))
    const user = userEvent.setup()
    render(<ConfiguracionPage />)

    const fileInput = screen.getByTestId('hero-file-input') as HTMLInputElement
    const file = new File(['x'], 'hero.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, file)

    await user.click(screen.getByRole('button', { name: /Subir imagen/i }))

    await waitFor(() => {
      expect(screen.getByText(/Error al subir la imagen/i)).toBeInTheDocument()
    })
  })

  it('updates the hero preview after a successful upload', async () => {
    mockGet.mockResolvedValue({ content_json: {} })
    mockUpload.mockResolvedValue({ image_url: 'https://cdn/test.jpg' })
    const user = userEvent.setup()
    render(<ConfiguracionPage />)

    const fileInput = screen.getByTestId('hero-file-input') as HTMLInputElement
    const file = new File(['x'], 'hero.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, file)

    await user.click(screen.getByRole('button', { name: /Subir imagen/i }))

    await waitFor(() => {
      expect(screen.getByAltText('Hero preview')).toHaveAttribute('src', 'https://cdn/test.jpg')
    })
  })

  it('selects a preset background color when its swatch is clicked', async () => {
    mockGet.mockResolvedValue({ content_json: {} })
    mockUpdate.mockResolvedValue({})
    const user = userEvent.setup()
    render(<ConfiguracionPage />)

    const navySwatch = await screen.findByTitle('Navy')
    await user.click(navySwatch)
    await user.click(screen.getByRole('button', { name: /Guardar cinta/i }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('promo_banner', expect.objectContaining({ bg_color: '#1B2A4A', text_color: '#fff' }))
    })
  })
})
