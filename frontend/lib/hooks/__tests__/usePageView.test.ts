import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@/lib/services/analyticsService', () => ({
  analyticsService: { recordPageView: jest.fn() },
}))

import { usePathname } from 'next/navigation'
import { analyticsService } from '@/lib/services/analyticsService'
import { usePageView } from '../usePageView'

const mockUsePathname = usePathname as unknown as jest.Mock
const mockRecordPageView = analyticsService.recordPageView as jest.Mock

describe('usePageView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('records page view with url_path and session_id on a public route', async () => {
    mockUsePathname.mockReturnValue('/catalog')
    renderHook(() => usePageView())
    await waitFor(() => {
      expect(mockRecordPageView).toHaveBeenCalledWith(
        expect.objectContaining({
          url_path: '/catalog',
          session_id: expect.any(String),
        })
      )
    })
  })

  it('skips recording on /backoffice routes', () => {
    mockUsePathname.mockReturnValue('/backoffice/pedidos')
    renderHook(() => usePageView())
    expect(mockRecordPageView).not.toHaveBeenCalled()
  })

  it('skips recording on /sign- routes', () => {
    mockUsePathname.mockReturnValue('/sign-in')
    renderHook(() => usePageView())
    expect(mockRecordPageView).not.toHaveBeenCalled()
  })

  it('saves a new session id to localStorage when none exists', async () => {
    mockUsePathname.mockReturnValue('/catalog')
    renderHook(() => usePageView())
    await waitFor(() => {
      expect(localStorage.getItem('mmts_sid')).toBeTruthy()
    })
  })

  it('reuses an existing session id from localStorage', async () => {
    localStorage.setItem('mmts_sid', 'existing-sess-abc')
    mockUsePathname.mockReturnValue('/catalog')
    renderHook(() => usePageView())
    await waitFor(() => {
      expect(mockRecordPageView).toHaveBeenCalledWith(
        expect.objectContaining({ session_id: 'existing-sess-abc' })
      )
    })
  })

  it('marks first-time visitor as new when mmts_visited is not set', async () => {
    mockUsePathname.mockReturnValue('/catalog')
    renderHook(() => usePageView())
    await waitFor(() => {
      expect(mockRecordPageView).toHaveBeenCalledWith(
        expect.objectContaining({ is_new_visitor: true })
      )
    })
  })
})
