import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../http', () => ({
  api: {
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

import { api } from '../http'
import { globalPresetService } from '../globalPresetService'

const mockPost = api.post as jest.Mock
const mockPatch = api.patch as jest.Mock
const mockDelete = api.delete as jest.Mock

describe('globalPresetService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSize', () => {
    it('posts a new size with label and cm', async () => {
      const mockSize = { id: 1, label: 'Mediano', cm: '30cm', sort_order: 2 }
      mockPost.mockResolvedValue({ data: mockSize })
      const result = await globalPresetService.createSize({ label: 'Mediano', cm: '30cm' })
      expect(mockPost).toHaveBeenCalledWith('/sizes/', { label: 'Mediano', cm: '30cm' })
      expect(result).toEqual(mockSize)
    })
  })

  describe('updateSize', () => {
    it('patches size is_active by id', async () => {
      const mockUpdated = { id: 1, label: 'Mediano', cm: '30cm', is_active: false }
      mockPatch.mockResolvedValue({ data: mockUpdated })
      const result = await globalPresetService.updateSize(1, { is_active: false })
      expect(mockPatch).toHaveBeenCalledWith('/sizes/1/', { is_active: false })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('deleteSize', () => {
    it('deletes a size by id', async () => {
      mockDelete.mockResolvedValue({})
      await globalPresetService.deleteSize(1)
      expect(mockDelete).toHaveBeenCalledWith('/sizes/1/')
    })
  })

  describe('createColor', () => {
    it('posts a new color with name and hex code', async () => {
      const mockColor = { id: 1, name: 'Coral', slug: 'coral', hex_code: '#FF6B6B' }
      mockPost.mockResolvedValue({ data: mockColor })
      const result = await globalPresetService.createColor({ name: 'Coral', hex_code: '#FF6B6B' })
      expect(mockPost).toHaveBeenCalledWith('/colors/', { name: 'Coral', hex_code: '#FF6B6B' })
      expect(result).toEqual(mockColor)
    })
  })

  describe('updateColor', () => {
    it('patches color sort order by id', async () => {
      const mockUpdated = { id: 1, name: 'Coral', slug: 'coral', hex_code: '#FF6B6B', sort_order: 3 }
      mockPatch.mockResolvedValue({ data: mockUpdated })
      const result = await globalPresetService.updateColor(1, { sort_order: 3 })
      expect(mockPatch).toHaveBeenCalledWith('/colors/1/', { sort_order: 3 })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('deleteGalleryImage', () => {
    it('deletes a gallery image by peluch slug and attachment id', async () => {
      mockDelete.mockResolvedValue({})
      await globalPresetService.deleteGalleryImage('osito-coral', 5)
      expect(mockDelete).toHaveBeenCalledWith('/peluches/osito-coral/gallery/5/')
    })
  })
})
