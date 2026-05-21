import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { compressImage } from '../imageCompressor'

describe('compressImage', () => {
  beforeEach(() => {
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns non-image file without processing', async () => {
    const file = new File(['text content'], 'document.txt', { type: 'text/plain' })
    const result = await compressImage(file)
    expect(result).toBe(file)
    expect(global.URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('returns small image file unchanged when within 1400x1400 limit', async () => {
    const file = new File(['img'], 'small.jpg', { type: 'image/jpeg' })

    ;(global as any).Image = class {
      width = 400
      height = 300
      set src(_: string) {
        ;(this as any).onload?.()
      }
    }

    const result = await compressImage(file)
    expect(result).toBe(file)
  })

  it('compresses oversized image and returns a resized File', async () => {
    const file = new File(['img'], 'large.jpg', { type: 'image/jpeg' })
    const mockBlob = new Blob(['compressed-data'], { type: 'image/jpeg' })
    const mockCtx = { drawImage: jest.fn() }
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(mockCtx),
      toBlob: jest.fn().mockImplementation((cb: (b: Blob) => void) => cb(mockBlob)),
    }
    jest.spyOn(document, 'createElement').mockReturnValueOnce(mockCanvas as unknown as HTMLElement)

    ;(global as any).Image = class {
      width = 2800
      height = 2100
      set src(_: string) {
        ;(this as any).onload?.()
      }
    }

    const result = await compressImage(file)
    expect(result).not.toBe(file)
    expect(result.name).toBe('large.jpg')
    expect(result.type).toBe('image/jpeg')
  })

  it('rejects with an error when image fails to load', async () => {
    const file = new File(['img'], 'corrupt.jpg', { type: 'image/jpeg' })

    ;(global as any).Image = class {
      set src(_: string) {
        ;(this as any).onerror?.()
      }
    }

    await expect(compressImage(file)).rejects.toThrow('Failed to load image')
  })
})
