import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../http', () => ({
  api: {
    post: jest.fn(),
  },
}))

import { api } from '../http'
import { analyticsService } from '../analyticsService'

const mockPost = api.post as jest.Mock

const pageViewData = {
  url_path: '/catalog',
  session_id: 'sess-abc123',
  is_new_visitor: true,
  device_type: 'desktop' as const,
  traffic_source: 'direct' as const,
}

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('recordPageView', () => {
    it('posts page view data to analytics endpoint', async () => {
      mockPost.mockResolvedValue({ data: {} })
      await analyticsService.recordPageView(pageViewData)
      expect(mockPost).toHaveBeenCalledWith('/analytics/pageview/', pageViewData)
    })

    it('returns null when the api call fails', async () => {
      mockPost.mockRejectedValue(new Error('Network error'))
      const result = await analyticsService.recordPageView(pageViewData)
      expect(result).toBeNull()
    })
  })
})
