import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../http', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

import { api } from '../http'
import { peluchService } from '../peluchService'
import { mockPeluches } from '../../__tests__/fixtures'

const mockGet = api.get as jest.Mock
const mockPost = api.post as jest.Mock

describe('peluchService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listPeluches', () => {
    it('fetches peluches list with filter params', async () => {
      mockGet.mockResolvedValue({ data: mockPeluches })
      const params = { category: 'osito', sort: 'popular' as const }
      const result = await peluchService.listPeluches(params)
      expect(mockGet).toHaveBeenCalledWith('/peluches/', { params })
      expect(result).toEqual(mockPeluches)
    })
  })

  describe('getFeatured', () => {
    it('fetches featured peluches', async () => {
      mockGet.mockResolvedValue({ data: mockPeluches })
      const result = await peluchService.getFeatured()
      expect(mockGet).toHaveBeenCalledWith('/peluches/featured/')
      expect(result).toEqual(mockPeluches)
    })
  })

  describe('getPeluchBySlug', () => {
    it('fetches peluch detail by slug', async () => {
      const mockDetail = { ...mockPeluches[0], sizes: [] }
      mockGet.mockResolvedValue({ data: mockDetail })
      const result = await peluchService.getPeluchBySlug('osito-coral')
      expect(mockGet).toHaveBeenCalledWith('/peluches/osito-coral/')
      expect(result).toEqual(mockDetail)
    })
  })

  describe('getCategories', () => {
    it('fetches product categories', async () => {
      const mockCategories = [{ id: 1, name: 'Ositos', slug: 'ositos' }]
      mockGet.mockResolvedValue({ data: mockCategories })
      const result = await peluchService.getCategories()
      expect(mockGet).toHaveBeenCalledWith('/categories/')
      expect(result).toEqual(mockCategories)
    })
  })

  describe('getSizes', () => {
    it('fetches available sizes', async () => {
      const mockSizes = [{ id: 1, label: 'Pequeño', size_code: 'S' }]
      mockGet.mockResolvedValue({ data: mockSizes })
      const result = await peluchService.getSizes()
      expect(mockGet).toHaveBeenCalledWith('/sizes/')
      expect(result).toEqual(mockSizes)
    })
  })

  describe('getColors', () => {
    it('fetches available colors', async () => {
      const mockColors = [{ id: 1, name: 'Rosa', slug: 'rosa', hex_code: '#FF69B4' }]
      mockGet.mockResolvedValue({ data: mockColors })
      const result = await peluchService.getColors()
      expect(mockGet).toHaveBeenCalledWith('/colors/')
      expect(result).toEqual(mockColors)
    })
  })

  describe('getReviews', () => {
    it('fetches reviews for a peluch slug', async () => {
      const mockReviews = [{ id: 1, rating: 5, comment: 'Excelente!' }]
      mockGet.mockResolvedValue({ data: mockReviews })
      const result = await peluchService.getReviews('osito-coral')
      expect(mockGet).toHaveBeenCalledWith('/peluches/osito-coral/reviews/')
      expect(result).toEqual(mockReviews)
    })
  })

  describe('createReview', () => {
    it('posts a new review for a peluch', async () => {
      const newReview = { id: 1, rating: 5, comment: 'Perfecto' }
      mockPost.mockResolvedValue({ data: newReview })
      const reviewData = { rating: 5, comment: 'Perfecto' }
      const result = await peluchService.createReview('osito-coral', reviewData)
      expect(mockPost).toHaveBeenCalledWith('/peluches/osito-coral/reviews/', reviewData)
      expect(result).toEqual(newReview)
    })
  })

  describe('getColorImages', () => {
    it('fetches color images for a peluch and color slug', async () => {
      const mockImages = [{ id: 1, image_url: 'http://example.com/img.jpg' }]
      mockGet.mockResolvedValue({ data: mockImages })
      const result = await peluchService.getColorImages('osito-coral', 'rosa-coral')
      expect(mockGet).toHaveBeenCalledWith('/peluches/osito-coral/color-image/rosa-coral/')
      expect(result).toEqual(mockImages)
    })
  })
})
