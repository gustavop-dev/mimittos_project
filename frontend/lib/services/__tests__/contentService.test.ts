import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../http', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}))

import { api } from '../http'
import { contentService } from '../contentService'

const mockGet = api.get as jest.Mock
const mockPut = api.put as jest.Mock

describe('contentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('get', () => {
    it('fetches site content by key', async () => {
      const mockContent = {
        key: 'faq',
        content_json: { items: [{ q: '¿Qué es Mimittos?', a: 'Una marca de peluches.' }] },
        updated_at: '2026-01-01T00:00:00Z',
      }
      mockGet.mockResolvedValue({ data: mockContent })
      const result = await contentService.get('faq')
      expect(mockGet).toHaveBeenCalledWith('/content/faq/')
      expect(result).toEqual(mockContent)
    })
  })

  describe('update', () => {
    it('updates site content for a key', async () => {
      const payload = { items: [{ q: '¿Envíos?', a: 'Sí, a todo Colombia.' }] }
      const mockUpdated = { key: 'faq', content_json: payload, updated_at: '2026-04-22T00:00:00Z' }
      mockPut.mockResolvedValue({ data: mockUpdated })
      const result = await contentService.update('faq', payload)
      expect(mockPut).toHaveBeenCalledWith('/content/faq/', { content_json: payload })
      expect(result).toEqual(mockUpdated)
    })
  })
})
