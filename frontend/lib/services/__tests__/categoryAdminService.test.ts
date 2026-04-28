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
    it('posts a new category with FormData and multipart header', async () => {
      const mockCategory = { id: 1, name: 'Ositos', slug: 'ositos' }
      mockPost.mockResolvedValue({ data: mockCategory })
      const formData = new FormData()
      formData.append('name', 'Ositos')
      formData.append('display_order', '1')
      formData.append('is_active', 'true')
      const result = await categoryAdminService.create(formData)
      expect(mockPost).toHaveBeenCalledWith(
        '/categories/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      expect(result).toEqual(mockCategory)
    })
  })

  describe('update', () => {
    it('patches an existing category by id with FormData and multipart header', async () => {
      const mockUpdated = { id: 1, name: 'Ositos Clásicos', slug: 'ositos-clasicos' }
      mockPatch.mockResolvedValue({ data: mockUpdated })
      const formData = new FormData()
      formData.append('name', 'Ositos Clásicos')
      const result = await categoryAdminService.update(1, formData)
      expect(mockPatch).toHaveBeenCalledWith(
        '/categories/1/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
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
