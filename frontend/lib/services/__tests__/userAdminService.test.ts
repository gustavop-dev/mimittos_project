import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../http', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}))

import { api } from '../http'
import { userAdminService } from '../userAdminService'

const mockGet = api.get as jest.Mock
const mockPatch = api.patch as jest.Mock

describe('userAdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('list', () => {
    it('fetches all users', async () => {
      const mockUsers = [{ id: 1, email: 'test@example.com', role: 'customer' }]
      mockGet.mockResolvedValue({ data: mockUsers })
      const result = await userAdminService.list()
      expect(mockGet).toHaveBeenCalledWith('/users/')
      expect(result).toEqual(mockUsers)
    })
  })

  describe('update', () => {
    it('patches user role and active status by id', async () => {
      const mockUpdated = { id: 1, email: 'test@example.com', role: 'admin', is_staff: true }
      mockPatch.mockResolvedValue({ data: mockUpdated })
      const result = await userAdminService.update(1, { role: 'admin', is_staff: true })
      expect(mockPatch).toHaveBeenCalledWith('/users/1/', { role: 'admin', is_staff: true })
      expect(result).toEqual(mockUpdated)
    })
  })
})
