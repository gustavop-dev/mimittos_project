import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../http', () => ({
  api: {
    get: jest.fn(),
  },
}))

import { api } from '../http'
import { analyticsAdminService } from '../analyticsAdminService'

const mockGet = api.get as jest.Mock

describe('analyticsAdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  describe('getDashboard', () => {
    it('fetches dashboard data with date range params', async () => {
      const mockData = { total_orders: 10, confirmed_revenue: 500000 }
      mockGet.mockResolvedValue({ data: mockData })
      const result = await analyticsAdminService.getDashboard('2026-01-01', '2026-04-22')
      expect(mockGet).toHaveBeenCalledWith('/analytics/dashboard/', {
        params: { date_from: '2026-01-01', date_to: '2026-04-22' },
      })
      expect(result).toEqual(mockData)
    })
  })

  describe('exportOrdersCSV', () => {
    it('triggers a CSV file download via anchor click', async () => {
      const mockBlob = new Blob(['csv data'], { type: 'text/csv' })
      mockGet.mockResolvedValue({ data: mockBlob })
      const mockAnchor = { href: '', download: '', click: jest.fn() }
      jest.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor as unknown as HTMLElement)

      await analyticsAdminService.exportOrdersCSV('2026-01-01', '2026-04-22')

      expect(mockAnchor.download).toBe('pedidos-2026-01-01.csv')
      expect(mockAnchor.click).toHaveBeenCalledTimes(1)
    })
  })
})
