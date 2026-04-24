import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../http', () => ({
  api: {
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

import { api } from '../http'
import { categoryAdminService } from '../categoryAdminService'

const mockPost = api.post as jest.Mock
const mockPatch = api.patch as jest.Mock
const mockDelete = api.delete as jest.Mock

describe('categoryAdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('posts a new category with payload', async () => {
      const mockCategory = { id: 1, name: 'Ositos', slug: 'ositos' }
      mockPost.mockResolvedValue({ data: mockCategory })
      const result = await categoryAdminService.create({ name: 'Ositos', display_order: 1, is_active: true })
      expect(mockPost).toHaveBeenCalledWith('/categories/', { name: 'Ositos', display_order: 1, is_active: true })
      expect(result).toEqual(mockCategory)
    })
  })

  describe('update', () => {
    it('patches an existing category by id', async () => {
      const mockUpdated = { id: 1, name: 'Ositos Clásicos', slug: 'ositos-clasicos' }
      mockPatch.mockResolvedValue({ data: mockUpdated })
      const result = await categoryAdminService.update(1, { name: 'Ositos Clásicos' })
      expect(mockPatch).toHaveBeenCalledWith('/categories/1/', { name: 'Ositos Clásicos' })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('delete', () => {
    it('deletes a category by id', async () => {
      mockDelete.mockResolvedValue({})
      await categoryAdminService.delete(1)
      expect(mockDelete).toHaveBeenCalledWith('/categories/1/')
    })
  })
})
