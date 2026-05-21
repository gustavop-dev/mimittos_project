import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { compressImage, ImageTooLargeError, TARGET_BYTES } from '../imageCompressor'

function mockImage(width: number, height: number) {
  ;(global as any).Image = class {
    width = width
    height = height
    set src(_: string) { ;(this as any).onload?.() }
  }
}

function mockCanvas(blobSizeByQuality: (quality: number) => number) {
  const ctx = { drawImage: jest.fn() }
  const canvas = {
    width: 0,
    height: 0,
    getContext: jest.fn().mockReturnValue(ctx),
    toBlob: jest.fn().mockImplementation((cb: (b: Blob) => void, _type: string, quality: number) => {
      cb(new Blob([new Uint8Array(blobSizeByQuality(quality))], { type: 'image/jpeg' }))
    }),
  }
  jest.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement)
  return canvas
}

describe('compressImage', () => {
  beforeEach(() => {
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })
  afterEach(() => jest.restoreAllMocks())

  it('returns a non-image file untouched', async () => {
    const file = new File(['x'], 'doc.txt', { type: 'text/plain' })
    expect(await compressImage(file)).toBe(file)
  })

  it('returns an image untouched when it is already small in bytes and dimensions', async () => {
    const file = new File(['tiny'], 'small.jpg', { type: 'image/jpeg' })
    mockImage(400, 300)
    expect(await compressImage(file)).toBe(file)
  })

  it('re-encodes an oversized image to a jpeg File under the target', async () => {
    const big = new File([new Uint8Array(TARGET_BYTES + 1000)], 'big.png', { type: 'image/png' })
    mockImage(3000, 2000)
    mockCanvas(() => 200_000)
    const result = await compressImage(big)
    expect(result).not.toBe(big)
    expect(result.type).toBe('image/jpeg')
    expect(result.name).toBe('big.jpg')
    expect(result.size).toBeLessThanOrEqual(TARGET_BYTES)
  })

  it('steps down quality until the blob fits under the target', async () => {
    const big = new File([new Uint8Array(TARGET_BYTES + 1000)], 'big.jpg', { type: 'image/jpeg' })
    mockImage(3000, 2000)
    // only the lowest quality (0.4) produces a small enough blob
    mockCanvas((quality) => (quality <= 0.4 ? 100_000 : TARGET_BYTES + 5000))
    const result = await compressImage(big)
    expect(result.size).toBeLessThanOrEqual(TARGET_BYTES)
  })

  it('re-encodes a heavy file even when its dimensions are within limits', async () => {
    const heavy = new File([new Uint8Array(TARGET_BYTES + 1000)], 'heavy.jpg', { type: 'image/jpeg' })
    mockImage(800, 600)
    mockCanvas(() => 200_000)
    const result = await compressImage(heavy)
    expect(result).not.toBe(heavy)
    expect(result.type).toBe('image/jpeg')
    expect(result.size).toBeLessThanOrEqual(TARGET_BYTES)
  })

  it('throws ImageTooLargeError when no quality step fits under the target', async () => {
    const big = new File([new Uint8Array(TARGET_BYTES + 1000)], 'huge.jpg', { type: 'image/jpeg' })
    mockImage(3000, 2000)
    mockCanvas(() => TARGET_BYTES + 5000)
    await expect(compressImage(big)).rejects.toThrow(ImageTooLargeError)
  })

  it('rejects when the image fails to load', async () => {
    const file = new File(['x'], 'corrupt.jpg', { type: 'image/jpeg' })
    ;(global as any).Image = class {
      set src(_: string) { ;(this as any).onerror?.() }
    }
    await expect(compressImage(file)).rejects.toThrow('Failed to load image')
  })
})
