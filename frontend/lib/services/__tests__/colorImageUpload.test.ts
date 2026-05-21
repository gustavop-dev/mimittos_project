import { uploadColorImageWithRetry } from '../colorImageUpload'
import { peluchAdminService } from '../peluchAdminService'

jest.mock('../peluchAdminService', () => ({
  peluchAdminService: { uploadColorImage: jest.fn() },
}))

const mockUpload = peluchAdminService.uploadColorImage as jest.Mock
const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' })

beforeEach(() => mockUpload.mockReset())

it('returns the upload result on the first success', async () => {
  mockUpload.mockResolvedValue({ id: 1, color_id: 2, url: '/u.jpg' })
  const result = await uploadColorImageWithRetry('osito', 'rojo', file)
  expect(result).toEqual({ id: 1, color_id: 2, url: '/u.jpg' })
  expect(mockUpload).toHaveBeenCalledTimes(1)
})

it('retries a transient 5xx failure and then succeeds', async () => {
  mockUpload
    .mockRejectedValueOnce({ response: { status: 502 } })
    .mockResolvedValue({ id: 1, color_id: 2, url: '/u.jpg' })
  const result = await uploadColorImageWithRetry('osito', 'rojo', file)
  expect(result.id).toBe(1)
  expect(mockUpload).toHaveBeenCalledTimes(2)
})

it('retries a network error (no response) and then succeeds', async () => {
  mockUpload
    .mockRejectedValueOnce(new Error('Network Error'))
    .mockResolvedValue({ id: 1, color_id: 2, url: '/u.jpg' })
  const result = await uploadColorImageWithRetry('osito', 'rojo', file)
  expect(result.id).toBe(1)
  expect(mockUpload).toHaveBeenCalledTimes(2)
})

it('does not retry a permanent 4xx failure', async () => {
  mockUpload.mockRejectedValue({ response: { status: 413 } })
  await expect(uploadColorImageWithRetry('osito', 'rojo', file)).rejects.toBeDefined()
  expect(mockUpload).toHaveBeenCalledTimes(1)
})

it('gives up after 3 attempts on a persistent transient failure', async () => {
  mockUpload.mockRejectedValue({ response: { status: 500 } })
  await expect(uploadColorImageWithRetry('osito', 'rojo', file)).rejects.toBeDefined()
  expect(mockUpload).toHaveBeenCalledTimes(3)
})
