import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../http', () => ({
  api: {
    post: jest.fn(),
  },
}))

import { api } from '../http'
import { mediaService } from '../mediaService'

const mockPost = api.post as jest.Mock

describe('mediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('uploadImage', () => {
    it('posts image file as FormData with huella_image media type', async () => {
      const mockResponse = { id: 1, url: 'http://example.com/image.jpg', media_type: 'huella_image' }
      mockPost.mockResolvedValue({ data: mockResponse })
      const file = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' })

      const result = await mediaService.uploadImage(file)

      const [endpoint, formData, config] = mockPost.mock.calls[0] as [string, FormData, object]
      expect(endpoint).toBe('/media/upload/')
      expect(formData.get('media_type')).toBe('huella_image')
      expect(formData.get('file')).toBe(file)
      expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('uploadAudio', () => {
    it('posts audio file as FormData with audio media type', async () => {
      const mockResponse = { id: 2, url: 'http://example.com/sound.mp3', media_type: 'audio' }
      mockPost.mockResolvedValue({ data: mockResponse })
      const file = new File(['audio data'], 'recording.mp3', { type: 'audio/mpeg' })

      const result = await mediaService.uploadAudio(file)

      const [endpoint, formData, config] = mockPost.mock.calls[0] as [string, FormData, object]
      expect(endpoint).toBe('/media/upload/')
      expect(formData.get('media_type')).toBe('audio')
      expect(formData.get('file')).toBe(file)
      expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
      expect(result).toEqual(mockResponse)
    })
  })
})
