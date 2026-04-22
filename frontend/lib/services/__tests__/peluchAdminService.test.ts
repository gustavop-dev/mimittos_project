import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../http', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

import { api } from '../http'
import { peluchAdminService } from '../peluchAdminService'
import { mockPeluches } from '../../__tests__/fixtures'

const mockGet = api.get as jest.Mock
const mockPost = api.post as jest.Mock
const mockPatch = api.patch as jest.Mock
const mockDelete = api.delete as jest.Mock

const minimalPayload = {
  title: 'Osito Nuevo',
  slug: 'osito-nuevo',
  category: 1,
  lead_description: 'Un osito hermoso',
  description: ['Descripción corta'],
  badge: 'new',
  is_active: true,
  is_featured: false,
  has_huella: false,
  has_corazon: false,
  has_audio: false,
  huella_extra_cost: 0,
  corazon_extra_cost: 0,
  audio_extra_cost: 0,
  available_color_ids: [1],
  size_prices_data: [{ size_id: 1, price: 85000, is_available: true }],
}

describe('peluchAdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listAll', () => {
    it('fetches all peluches', async () => {
      mockGet.mockResolvedValue({ data: mockPeluches })
      const result = await peluchAdminService.listAll()
      expect(mockGet).toHaveBeenCalledWith('/peluches/')
      expect(result).toEqual(mockPeluches)
    })
  })

  describe('create', () => {
    it('posts a new peluch with full payload', async () => {
      mockPost.mockResolvedValue({ data: mockPeluches[0] })
      const result = await peluchAdminService.create(minimalPayload)
      expect(mockPost).toHaveBeenCalledWith('/peluches/', minimalPayload)
      expect(result).toEqual(mockPeluches[0])
    })
  })

  describe('update', () => {
    it('patches peluch title by slug', async () => {
      const mockUpdated = { ...mockPeluches[0], title: 'Osito Actualizado' }
      mockPatch.mockResolvedValue({ data: mockUpdated })
      const result = await peluchAdminService.update('osito-coral', { title: 'Osito Actualizado' })
      expect(mockPatch).toHaveBeenCalledWith('/peluches/osito-coral/', { title: 'Osito Actualizado' })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('delete', () => {
    it('deletes a peluch by slug', async () => {
      mockDelete.mockResolvedValue({})
      await peluchAdminService.delete('osito-coral')
      expect(mockDelete).toHaveBeenCalledWith('/peluches/osito-coral/')
    })
  })

  describe('getColorImages', () => {
    it('fetches color images by peluch and color slug', async () => {
      const mockImages = [{ id: 1, image_url: 'http://example.com/img.jpg' }]
      mockGet.mockResolvedValue({ data: mockImages })
      const result = await peluchAdminService.getColorImages('osito-coral', 'rosa-coral')
      expect(mockGet).toHaveBeenCalledWith('/peluches/osito-coral/color-image/rosa-coral/')
      expect(result).toEqual(mockImages)
    })
  })

  describe('uploadColorImage', () => {
    it('posts color image as FormData', async () => {
      const mockResponse = { id: 1, color_id: 1, url: 'http://example.com/img.jpg' }
      mockPost.mockResolvedValue({ data: mockResponse })
      const file = new File(['image'], 'coral.jpg', { type: 'image/jpeg' })

      const result = await peluchAdminService.uploadColorImage('osito-coral', 'rosa-coral', file)

      const [endpoint, formData] = mockPost.mock.calls[0] as [string, FormData]
      expect(endpoint).toBe('/peluches/osito-coral/color-image/rosa-coral/')
      expect(formData.get('image')).toBe(file)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('bulkUpdateCategory', () => {
    it('patches category for multiple peluches by slug list', async () => {
      mockPatch.mockResolvedValue({ data: { updated: 2 } })
      const result = await peluchAdminService.bulkUpdateCategory(['osito-coral', 'conejito-lucia'], 3)
      expect(mockPatch).toHaveBeenCalledWith('/peluches/bulk-category/', {
        slug_list: ['osito-coral', 'conejito-lucia'],
        category_id: 3,
      })
      expect(result).toEqual({ updated: 2 })
    })
  })
})
