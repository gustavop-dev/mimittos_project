import { renderHook, act, waitFor } from '@testing-library/react'
import { useColorImageUpload } from '../useColorImageUpload'
import { uploadColorImageWithRetry } from '@/lib/services/colorImageUpload'

jest.mock('@/lib/services/colorImageUpload', () => ({ uploadColorImageWithRetry: jest.fn() }))
jest.mock('@/lib/services/peluchAdminService', () => ({
  peluchAdminService: { deleteColorImage: jest.fn() },
}))
jest.mock('@/lib/utils/imageCompressor', () => ({
  compressImage: jest.fn((f: File) => Promise.resolve(f)),
  ImageTooLargeError: class ImageTooLargeError extends Error {},
}))

const mockUpload = uploadColorImageWithRetry as jest.Mock
const file = () => new File(['x'], 'a.jpg', { type: 'image/jpeg' })

beforeEach(() => {
  jest.clearAllMocks()
  global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock')
  global.URL.revokeObjectURL = jest.fn()
})

it('marks an image as done after a successful upload', async () => {
  mockUpload.mockResolvedValue({ id: 9, color_id: 1, url: '/srv.jpg' })
  const { result } = renderHook(() =>
    useColorImageUpload({ resolveUploadSlug: async () => 'osito' }),
  )

  await act(async () => { await result.current.uploadFiles('rojo', [file()]) })

  await waitFor(() => {
    expect(result.current.colorGallery.rojo[0].status).toBe('done')
  })
  expect(result.current.colorGallery.rojo[0].id).toBe(9)
})

it('marks an image as failed when the upload throws', async () => {
  mockUpload.mockRejectedValue({ response: { status: 413 } })
  const { result } = renderHook(() =>
    useColorImageUpload({ resolveUploadSlug: async () => 'osito' }),
  )

  await act(async () => { await result.current.uploadFiles('rojo', [file()]) })

  await waitFor(() => {
    expect(result.current.colorGallery.rojo[0].status).toBe('failed')
  })
})

it('reports pending work while an image is failed', async () => {
  mockUpload.mockRejectedValue({ response: { status: 413 } })
  const { result } = renderHook(() =>
    useColorImageUpload({ resolveUploadSlug: async () => 'osito' }),
  )

  await act(async () => { await result.current.uploadFiles('rojo', [file()]) })

  await waitFor(() => expect(result.current.hasPendingWork).toBe(true))
})

it('retries a failed image and marks it done on success', async () => {
  mockUpload.mockRejectedValueOnce({ response: { status: 413 } })
  const { result } = renderHook(() =>
    useColorImageUpload({ resolveUploadSlug: async () => 'osito' }),
  )
  await act(async () => { await result.current.uploadFiles('rojo', [file()]) })
  await waitFor(() => expect(result.current.colorGallery.rojo[0].status).toBe('failed'))

  mockUpload.mockResolvedValue({ id: 5, color_id: 1, url: '/srv.jpg' })
  await act(async () => { await result.current.retryAll() })

  await waitFor(() => expect(result.current.colorGallery.rojo[0].status).toBe('done'))
})
