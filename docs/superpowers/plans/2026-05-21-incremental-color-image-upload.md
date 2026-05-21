# Incremental Color Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload each color photo one-by-one to a peluche that exists from the start as a draft, with size-guaranteed compression, per-image status, and auto-retry.

**Architecture:** A draft `Peluch` (`is_active=false`) is created on the first photo upload; from then on the create form behaves like edit mode. Compression guarantees every image is under the nginx body limit; a reusable hook drives incremental upload with auto-retry and per-image status; "Guardar" is blocked while uploads are pending or failed.

**Tech Stack:** Next.js 16 + React + TypeScript, SweetAlert2 (already installed), Jest + Testing Library.

---

## Reference notes for the engineer

- **Frontend tests:** `cd frontend && npx jest <path>`.
- **Branch:** `feat/21052026-incremental-color-image-upload` (already created, rebased on `main`).
- `lib/utils/` has a **90% coverage threshold** (`jest.config.cjs`) — `imageCompressor.ts` lives there and must stay ≥90% covered. New files in `lib/services/` and `lib/hooks/` fall under the global 65% threshold.
- `next/image` is mocked in `jest.setup.ts`; the test environment is jsdom.
- `peluchAdminService.uploadColorImage(slug, colorSlug, file)` returns `Promise<{ id: number; color_id: number; url: string }>`; `deleteColorImage(slug, colorSlug, pciId)`, `create(payload)`, `update(slug, payload)`, `delete(slug)` all exist in `lib/services/peluchAdminService.ts`.
- `PeluchForm.tsx` is ~810 lines. Relevant anchors: `ColorGalleryItem` interface (lines 25-30), `colorGallery` state (line 90), the `existing`-load `useEffect` populating `colorGallery` (lines ~177-178), `handleColorFileSelect`, `handleColorImageRemove`, `toggleColor`, `handleSubmit` create branch (lines ~415-425), the color-gallery render (lines ~616-657), the submit/cancel buttons (lines ~720-727).

---

## Task 1: Size-guaranteed image compression

**Files:**
- Modify: `frontend/lib/utils/imageCompressor.ts` (full rewrite)
- Test: `frontend/lib/utils/__tests__/imageCompressor.test.ts`

- [ ] **Step 1: Replace the test file**

Overwrite `frontend/lib/utils/__tests__/imageCompressor.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx jest lib/utils/__tests__/imageCompressor.test.ts`
Expected: FAIL — `ImageTooLargeError` and `TARGET_BYTES` are not exported.

- [ ] **Step 3: Rewrite `imageCompressor.ts`**

Overwrite `frontend/lib/utils/imageCompressor.ts`:

```typescript
const MAX_DIM = 1400
export const TARGET_BYTES = 900_000
const QUALITY_STEPS = [0.82, 0.65, 0.5, 0.4]

export class ImageTooLargeError extends Error {
  constructor() {
    super('La imagen es demasiado pesada y no se pudo optimizar lo suficiente.')
    this.name = 'ImageTooLargeError'
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

function toJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

async function encodeUnderTarget(img: HTMLImageElement, maxDim: number): Promise<Blob | null> {
  const ratio = Math.min(1, maxDim / img.width, maxDim / img.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * ratio)
  canvas.height = Math.round(img.height * ratio)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  for (const quality of QUALITY_STEPS) {
    const blob = await toJpegBlob(canvas, quality)
    if (blob && blob.size <= TARGET_BYTES) return blob
  }
  return null
}

// Returns the original file when it is already safe (small bytes AND dimensions);
// otherwise re-encodes it to a JPEG guaranteed to be <= TARGET_BYTES, or throws
// ImageTooLargeError if even the lowest quality and a reduced size do not fit.
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const img = await loadImage(file)
  if (file.size <= TARGET_BYTES && img.width <= MAX_DIM && img.height <= MAX_DIM) {
    return file
  }

  let blob = await encodeUnderTarget(img, MAX_DIM)
  if (!blob) blob = await encodeUnderTarget(img, Math.round(MAX_DIM * 0.6))
  if (!blob) throw new ImageTooLargeError()

  const name = file.name.replace(/\.[^./]+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
}
```

> Note: this keeps the "return untouched" fast path only when the file is already under `TARGET_BYTES` *and* within `MAX_DIM` — it no longer skips based on dimensions alone, which is the spec's intent (a small-dimension but heavy file is now re-encoded).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx jest lib/utils/__tests__/imageCompressor.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/utils/imageCompressor.ts frontend/lib/utils/__tests__/imageCompressor.test.ts
git commit -m "feat(frontend): compress images under a guaranteed byte target"
```

---

## Task 2: Upload helper with auto-retry

**Files:**
- Create: `frontend/lib/services/colorImageUpload.ts`
- Test: `frontend/lib/services/__tests__/colorImageUpload.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/lib/services/__tests__/colorImageUpload.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx jest lib/services/__tests__/colorImageUpload.test.ts`
Expected: FAIL — `../colorImageUpload` does not exist.

- [ ] **Step 3: Create `colorImageUpload.ts`**

Create `frontend/lib/services/colorImageUpload.ts`:

```typescript
import { peluchAdminService } from './peluchAdminService'

const MAX_ATTEMPTS = 3

export interface UploadedColorImage {
  id: number
  color_id: number
  url: string
}

// A failure is transient (worth retrying) when there is no HTTP response
// (network error) or the server returned a 5xx. 4xx responses are permanent.
function isTransient(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status === undefined) return true
  return status >= 500
}

export async function uploadColorImageWithRetry(
  slug: string,
  colorSlug: string,
  file: File,
): Promise<UploadedColorImage> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await peluchAdminService.uploadColorImage(slug, colorSlug, file)
    } catch (err) {
      lastError = err
      if (!isTransient(err) || attempt === MAX_ATTEMPTS) break
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt))
    }
  }
  throw lastError
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx jest lib/services/__tests__/colorImageUpload.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/services/colorImageUpload.ts frontend/lib/services/__tests__/colorImageUpload.test.ts
git commit -m "feat(frontend): retry transient color-image upload failures"
```

---

## Task 3: `useColorImageUpload` hook

**Files:**
- Create: `frontend/lib/hooks/useColorImageUpload.ts`
- Test: `frontend/lib/hooks/__tests__/useColorImageUpload.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/lib/hooks/__tests__/useColorImageUpload.test.tsx`:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useColorImageUpload } from '../useColorImageUpload'
import { uploadColorImageWithRetry } from '@/lib/services/colorImageUpload'
import { compressImage } from '@/lib/utils/imageCompressor'

jest.mock('@/lib/services/colorImageUpload', () => ({ uploadColorImageWithRetry: jest.fn() }))
jest.mock('@/lib/services/peluchAdminService', () => ({
  peluchAdminService: { deleteColorImage: jest.fn() },
}))
jest.mock('@/lib/utils/imageCompressor', () => ({
  compressImage: jest.fn((f: File) => Promise.resolve(f)),
  ImageTooLargeError: class ImageTooLargeError extends Error {},
}))

const mockUpload = uploadColorImageWithRetry as jest.Mock
const mockCompress = compressImage as jest.Mock
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx jest lib/hooks/__tests__/useColorImageUpload.test.tsx`
Expected: FAIL — `../useColorImageUpload` does not exist.

- [ ] **Step 3: Create the hook**

Create `frontend/lib/hooks/useColorImageUpload.ts`:

```typescript
import { useCallback, useMemo, useState } from 'react'

import { peluchAdminService } from '@/lib/services/peluchAdminService'
import { uploadColorImageWithRetry } from '@/lib/services/colorImageUpload'
import { compressImage, ImageTooLargeError } from '@/lib/utils/imageCompressor'

export interface ColorGalleryItem {
  key: string
  id: number | null
  url: string
  status: 'uploading' | 'done' | 'failed'
  errorMessage?: string
  file?: File
}

export type ColorGallery = Record<string, ColorGalleryItem[]>

interface UseColorImageUploadArgs {
  // Resolves the peluch slug to upload to, creating the draft and syncing the
  // color on first call. Rejects if preconditions (title/category) are missing.
  resolveUploadSlug: (colorSlug: string) => Promise<string>
  initialGallery?: ColorGallery
}

let keySeq = 0
const nextKey = () => `cgi-${Date.now()}-${keySeq++}`

export function useColorImageUpload({ resolveUploadSlug, initialGallery }: UseColorImageUploadArgs) {
  const [colorGallery, setColorGallery] = useState<ColorGallery>(initialGallery ?? {})

  const patchItem = useCallback((colorSlug: string, key: string, patch: Partial<ColorGalleryItem>) => {
    setColorGallery((prev) => ({
      ...prev,
      [colorSlug]: (prev[colorSlug] ?? []).map((it) => (it.key === key ? { ...it, ...patch } : it)),
    }))
  }, [])

  const uploadOne = useCallback(async (colorSlug: string, key: string, raw: File) => {
    let compressed: File
    try {
      compressed = await compressImage(raw)
    } catch (err) {
      patchItem(colorSlug, key, {
        status: 'failed',
        errorMessage: err instanceof ImageTooLargeError ? err.message : 'No se pudo procesar la imagen.',
      })
      return
    }
    try {
      const slug = await resolveUploadSlug(colorSlug)
      const uploaded = await uploadColorImageWithRetry(slug, colorSlug, compressed)
      patchItem(colorSlug, key, { status: 'done', id: uploaded.id, url: uploaded.url, file: undefined })
    } catch {
      patchItem(colorSlug, key, { status: 'failed', errorMessage: 'No se pudo subir la imagen.', file: compressed })
    }
  }, [patchItem, resolveUploadSlug])

  const uploadFiles = useCallback(async (colorSlug: string, files: File[]) => {
    const items: ColorGalleryItem[] = files.map((f) => ({
      key: nextKey(),
      id: null,
      url: URL.createObjectURL(f),
      status: 'uploading',
      file: f,
    }))
    setColorGallery((prev) => ({ ...prev, [colorSlug]: [...(prev[colorSlug] ?? []), ...items] }))
    await Promise.all(items.map((it) => uploadOne(colorSlug, it.key, it.file!)))
  }, [uploadOne])

  const retryItem = useCallback(async (colorSlug: string, key: string) => {
    const item = (colorGallery[colorSlug] ?? []).find((it) => it.key === key)
    if (!item?.file) return
    patchItem(colorSlug, key, { status: 'uploading' })
    await uploadOne(colorSlug, key, item.file)
  }, [colorGallery, patchItem, uploadOne])

  const retryAll = useCallback(async () => {
    const failed: Array<[string, ColorGalleryItem]> = []
    for (const [colorSlug, items] of Object.entries(colorGallery)) {
      for (const it of items) if (it.status === 'failed' && it.file) failed.push([colorSlug, it])
    }
    await Promise.all(failed.map(([colorSlug, it]) => {
      patchItem(colorSlug, it.key, { status: 'uploading' })
      return uploadOne(colorSlug, it.key, it.file!)
    }))
  }, [colorGallery, patchItem, uploadOne])

  const removeImage = useCallback(async (colorSlug: string, key: string) => {
    const item = (colorGallery[colorSlug] ?? []).find((it) => it.key === key)
    if (item?.id != null) {
      try {
        const slug = await resolveUploadSlug(colorSlug)
        await peluchAdminService.deleteColorImage(slug, colorSlug, item.id)
      } catch { /* the image stays out of the gallery regardless */ }
    }
    if (item) URL.revokeObjectURL(item.url)
    setColorGallery((prev) => ({
      ...prev,
      [colorSlug]: (prev[colorSlug] ?? []).filter((it) => it.key !== key),
    }))
  }, [colorGallery, resolveUploadSlug])

  const hasPendingWork = useMemo(
    () => Object.values(colorGallery).some((items) => items.some((it) => it.status !== 'done')),
    [colorGallery],
  )

  return { colorGallery, setColorGallery, uploadFiles, retryItem, retryAll, removeImage, hasPendingWork }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx jest lib/hooks/__tests__/useColorImageUpload.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/hooks/useColorImageUpload.ts frontend/lib/hooks/__tests__/useColorImageUpload.test.tsx
git commit -m "feat(frontend): add useColorImageUpload hook for incremental upload"
```

---

## Task 4: Wire the draft model into `PeluchForm`

This task replaces `PeluchForm`'s in-memory `colorGallery` + post-create upload loop with the hook + a lazily-created draft peluche.

**Files:**
- Modify: `frontend/components/admin/PeluchForm.tsx`
- Test: `frontend/components/admin/__tests__/PeluchForm.test.tsx`

- [ ] **Step 1: Write the failing test**

In `frontend/components/admin/__tests__/PeluchForm.test.tsx`, add to the `peluchAdminService` mock object the methods `uploadColorImage` and `delete` if missing (they may already be present — keep one copy each), and add this test inside the `describe('PeluchForm', ...)` block:

```typescript
it('creates a draft peluche on the first color image upload', async () => {
  const { peluchService } = require('@/lib/services/peluchService')
  const { peluchAdminService } = require('@/lib/services/peluchAdminService')
  peluchService.getCategories.mockResolvedValue([
    { id: 1, name: 'Ositos', slug: 'ositos', description: '', display_order: 1, is_active: true, is_featured: false, image_url: null },
  ])
  peluchService.getSizes.mockResolvedValue([])
  peluchService.getColors.mockResolvedValue([
    { id: 1, name: 'Coral', slug: 'coral', hex_code: '#FF6B6B', sort_order: 1 },
  ])
  peluchAdminService.create.mockResolvedValue({ slug: 'osito-coral', available_colors: [] })
  peluchAdminService.update.mockResolvedValue({})
  peluchAdminService.uploadColorImage.mockResolvedValue({ id: 1, color_id: 1, url: '/srv.jpg' })

  render(<PeluchForm />)

  // fill the minimum fields the draft create needs
  await userEvent.type(await screen.findByPlaceholderText('Osito Suave Premium'), 'Osito Coral')
  await userEvent.selectOptions(screen.getByRole('combobox'), '1')
  // select the color so its gallery section renders
  await userEvent.click(screen.getByRole('button', { name: /Coral/ }))
  // upload a file to that color
  const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
  await userEvent.upload(fileInput, new File(['x'], 'p.jpg', { type: 'image/jpeg' }))

  await waitFor(() => {
    expect(peluchAdminService.create).toHaveBeenCalledTimes(1)
    expect(peluchAdminService.create.mock.calls[0][0].is_active).toBe(false)
  })
})
```

> The exact selectors (`getByRole('combobox')`, the color toggle button name) may need adjusting to the live markup — the color toggle button shows the color name; the category `<select>` is the first combobox. Verify against `PeluchForm.tsx` while implementing.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx jest components/admin/__tests__/PeluchForm.test.tsx -t "creates a draft"`
Expected: FAIL — no draft is created on upload (current code only creates on submit).

- [ ] **Step 3: Replace the imports and `ColorGalleryItem`**

In `PeluchForm.tsx`:
- Delete the local `interface ColorGalleryItem { ... }` (lines ~25-30).
- Add to the imports block:

```typescript
import { useColorImageUpload, type ColorGalleryItem } from '@/lib/hooks/useColorImageUpload'
```

(Keep `ColorGalleryItem` imported because other code references the type.)

- [ ] **Step 4: Replace `colorGallery` state with the hook**

Remove `const [colorGallery, setColorGallery] = useState<Record<string, ColorGalleryItem[]>>({})` (line ~90).

Add a `draftSlug` state and a `resolveUploadSlug` callback near the other state/handlers. Place this after the state declarations:

```typescript
  const [draftSlug, setDraftSlug] = useState<string | null>(null)

  // The slug of the peluche being edited: the existing one, or the draft once created.
  const targetSlug = existing?.slug ?? draftSlug

  // Builds the payload the backend needs to create/update a peluche.
  const buildPayload = useCallback((isActive: boolean) => ({
    title: form.title,
    slug: form.slug,
    category: Number(form.category),
    lead_description: form.lead_description,
    description: tryParseJson<string[]>(descriptionJson) ?? [],
    badge: form.badge,
    is_active: isActive,
    is_featured: form.is_featured,
    discount_pct: discountPct,
    display_order: displayOrder,
    has_huella: form.has_huella,
    has_corazon: form.has_corazon,
    has_audio: form.has_audio,
    huella_extra_cost: Number(form.huella_extra_cost),
    corazon_extra_cost: Number(form.corazon_extra_cost),
    audio_extra_cost: Number(form.audio_extra_cost),
    specifications: tryParseJson<Record<string, string>>(specificationsJson) ?? {},
    care_instructions: tryParseJson<string[]>(careJson) ?? [],
    available_color_ids: selectedColors,
    size_prices_data: sizePrices.map((r) => ({
      size_id: r.size_id,
      price: r.is_available ? Number(r.price) : 0,
      is_available: r.is_available,
      deposit_percentage: Math.min(100, Math.max(1, Number(r.deposit_percentage) || 50)),
      full_payment_discount_pct: Math.min(100, Math.max(0, Number(r.full_payment_discount_pct) || 0)),
      free_shipping: r.free_shipping,
      shipping_cost: r.free_shipping ? 0 : Math.max(0, Number(r.shipping_cost) || 0),
    })),
  }), [form, descriptionJson, specificationsJson, careJson, discountPct, displayOrder, selectedColors, sizePrices])

  // Returns the slug to upload to: the existing peluche, or a draft created on
  // first call. After the draft exists, keeps its colors in sync.
  const resolveUploadSlug = useCallback(async (): Promise<string> => {
    if (existing) return existing.slug
    if (draftSlug) {
      await peluchAdminService.update(draftSlug, { available_color_ids: selectedColors })
      return draftSlug
    }
    if (!form.title.trim() || !form.slug.trim() || !form.category) {
      throw new Error('Completa título y categoría antes de subir fotos.')
    }
    const created = await peluchAdminService.create(buildPayload(false))
    setDraftSlug(created.slug)
    return created.slug
  }, [existing, draftSlug, selectedColors, form.title, form.slug, form.category, buildPayload])

  const initialGallery = useMemo<Record<string, ColorGalleryItem[]>>(() => {
    const gallery: Record<string, ColorGalleryItem[]> = {}
    for (const c of existing?.available_colors ?? []) {
      gallery[c.slug] = (c.images ?? []).map((item, i) => ({
        key: `existing-${c.slug}-${i}`,
        id: item.id,
        url: item.url,
        status: 'done' as const,
      }))
    }
    return gallery
  }, [existing])

  const {
    colorGallery, setColorGallery, uploadFiles, retryItem, retryAll, removeImage, hasPendingWork,
  } = useColorImageUpload({ resolveUploadSlug, initialGallery })
```

> `useCallback` and `useMemo` must be added to the `react` import at the top of the file.

- [ ] **Step 5: Remove the now-obsolete `colorGallery` loading in the `existing` effect**

In the `existing`-load `useEffect`, delete the block that builds `newGallery` from `existing.available_colors[].images` and calls `setColorGallery(newGallery)` (lines ~176-179) — the hook now seeds itself from `initialGallery`.

- [ ] **Step 6: Replace `handleColorFileSelect`**

Replace the whole `handleColorFileSelect` function with:

```typescript
  async function handleColorFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const colorSlug = uploadingColorSlug
    if (!colorSlug || files.length === 0) return
    if (!existing && (!form.title.trim() || !form.slug.trim() || !form.category)) {
      setError('Completa título y categoría antes de subir fotos.')
      return
    }
    setError('')
    await uploadFiles(colorSlug, files)
  }
```

- [ ] **Step 7: Replace `handleColorImageRemove`**

Replace the whole `handleColorImageRemove` function with:

```typescript
  async function handleColorImageRemove(colorSlug: string, item: ColorGalleryItem) {
    await removeImage(colorSlug, item.key)
  }
```

- [ ] **Step 8: Update `toggleColor` and `handleAddColor` / `handleDeleteColor` gallery writes**

These functions call `setColorGallery`. The hook still exposes `setColorGallery`, so those calls keep working unchanged. In `toggleColor`'s un-select branch, the per-product delete loop that calls `peluchAdminService.deleteColorImage` for `existing` still applies; leave it. No change needed beyond confirming `setColorGallery` resolves to the hook's setter.

- [ ] **Step 9: Run the test to verify it passes**

Run: `cd frontend && npx jest components/admin/__tests__/PeluchForm.test.tsx -t "creates a draft"`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add frontend/components/admin/PeluchForm.tsx frontend/components/admin/__tests__/PeluchForm.test.tsx
git commit -m "feat(frontend): create a draft peluche on first color image upload"
```

---

## Task 5: Per-image status UI, submit gating, cancel-deletes-draft

**Files:**
- Modify: `frontend/components/admin/PeluchForm.tsx`
- Test: `frontend/components/admin/__tests__/PeluchForm.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add inside the `describe('PeluchForm', ...)` block:

```typescript
it('disables the submit button while an image upload is pending', async () => {
  const { peluchService } = require('@/lib/services/peluchService')
  const { peluchAdminService } = require('@/lib/services/peluchAdminService')
  peluchService.getCategories.mockResolvedValue([
    { id: 1, name: 'Ositos', slug: 'ositos', description: '', display_order: 1, is_active: true, is_featured: false, image_url: null },
  ])
  peluchService.getSizes.mockResolvedValue([])
  peluchService.getColors.mockResolvedValue([
    { id: 1, name: 'Coral', slug: 'coral', hex_code: '#FF6B6B', sort_order: 1 },
  ])
  peluchAdminService.create.mockResolvedValue({ slug: 'osito-coral', available_colors: [] })
  peluchAdminService.uploadColorImage.mockRejectedValue({ response: { status: 413 } })

  render(<PeluchForm />)
  await userEvent.type(await screen.findByPlaceholderText('Osito Suave Premium'), 'Osito Coral')
  await userEvent.selectOptions(screen.getByRole('combobox'), '1')
  await userEvent.click(screen.getByRole('button', { name: /Coral/ }))
  const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
  await userEvent.upload(fileInput, new File(['x'], 'p.jpg', { type: 'image/jpeg' }))

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Crear peluche/ })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx jest components/admin/__tests__/PeluchForm.test.tsx -t "disables the submit"`
Expected: FAIL — the submit button does not yet react to failed uploads.

- [ ] **Step 3: Gate the submit button**

Find the submit button (lines ~720-723). Change its `disabled` and label:

```tsx
        <button type="submit" disabled={saving || hasPendingWork} style={{ padding: '12px 28px', background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 10, cursor: (saving || hasPendingWork) ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', opacity: (saving || hasPendingWork) ? .6 : 1 }}>
          {saving ? 'Guardando...' : (existing ? 'Guardar cambios' : 'Crear peluche')}
        </button>
```

Directly above the buttons row, add a warning shown when uploads are pending:

```tsx
      {hasPendingWork && (
        <p style={{ color: '#B8696F', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
          ⚠ Hay imágenes subiendo o sin subir. Reinténtalas o quítalas para poder guardar.
        </p>
      )}
```

- [ ] **Step 4: Render per-image status in the color gallery**

In the color-gallery render, the image tile currently shows `img.uploading` overlay and a remove button. Replace the inner tile markup (the `images.map(...)` block, lines ~639-640) with status-aware markup:

```tsx
                    {images.map((img) => (
                      <div key={img.key} style={{ position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${img.status === 'failed' ? '#E0A0A0' : 'rgba(27,42,74,.1)'}`, background: '#fff' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {img.status === 'uploading' && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>Subiendo...</div>
                        )}
                        {img.status === 'failed' && (
                          <button type="button" onClick={() => retryItem(color.slug, img.key)} title={img.errorMessage} style={{ position: 'absolute', inset: 0, background: 'rgba(184,105,111,.85)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>
                            ✗ Reintentar
                          </button>
                        )}
                        {img.status === 'done' && (
                          <span style={{ position: 'absolute', bottom: 3, left: 3, background: 'rgba(46,125,50,.9)', color: '#fff', borderRadius: 4, fontSize: 9, padding: '1px 4px' }}>✓</span>
                        )}
                        <button type="button" onClick={() => handleColorImageRemove(color.slug, img)} style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: '20px', textAlign: 'center', padding: 0 }}>×</button>
                      </div>
                    ))}
```

Below the "Galería de fotos por color" hint paragraph, add a "retry all" action shown when any image failed:

```tsx
          {Object.values(colorGallery).some((items) => items.some((it) => it.status === 'failed')) && (
            <button type="button" onClick={() => retryAll()} style={{ ...BtnOutline, marginBottom: 12 }}>
              ⟳ Reintentar todas las imágenes fallidas
            </button>
          )}
```

- [ ] **Step 5: Make the submit and cancel handlers draft-aware**

In `handleSubmit`, replace the `if (existing) { ... } else { ... }` block (lines ~413-426) with:

```typescript
      if (existing) {
        await peluchAdminService.update(existing.slug, buildPayload(form.is_active))
      } else if (draftSlug) {
        // The draft already exists (images were uploaded) — finalize it.
        await peluchAdminService.update(draftSlug, buildPayload(form.is_active))
      } else {
        // No images were uploaded; create the peluche directly.
        await peluchAdminService.create(buildPayload(form.is_active))
      }
```

(The old per-color upload loop is deleted — uploads already happened incrementally.)

Replace the "Cancelar" button's `onClick` (line ~724) with a handler that discards the draft:

```tsx
        <button type="button" onClick={handleCancel} style={{ padding: '12px 20px', background: 'var(--cream-warm)', color: 'var(--navy)', border: '1px solid rgba(27,42,74,.1)', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
          Cancelar
        </button>
```

And add the `handleCancel` function near the other handlers:

```typescript
  async function handleCancel() {
    if (draftSlug && window.confirm('¿Descartar el borrador y sus fotos?')) {
      try { await peluchAdminService.delete(draftSlug) } catch { /* ignore */ }
    }
    router.push('/backoffice/peluches')
  }
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd frontend && npx jest components/admin/__tests__/PeluchForm.test.tsx`
Expected: all PASS (the new tests plus the pre-existing ones).

- [ ] **Step 7: Commit**

```bash
git add frontend/components/admin/PeluchForm.tsx frontend/components/admin/__tests__/PeluchForm.test.tsx
git commit -m "feat(frontend): per-image upload status, save gating, draft cleanup"
```

---

## Task 6: "Borrador" badge in the backoffice peluche list

**Files:**
- Modify: `frontend/app/backoffice/peluches/page.tsx`
- Test: `frontend/app/backoffice/peluches/__tests__/page.test.tsx`

- [ ] **Step 1: Inspect the list page**

Read `frontend/app/backoffice/peluches/page.tsx` and find where each peluche row renders its title. The list uses `peluchAdminService.listAll()` which returns `PeluchDetail[]`; each item has `is_active: boolean`.

- [ ] **Step 2: Write the failing test**

In `frontend/app/backoffice/peluches/__tests__/page.test.tsx`, add a test that renders the page with one `is_active: false` peluche in the mocked `listAll` response and asserts a "Borrador" label appears:

```typescript
it('shows a Borrador badge for an inactive peluche', async () => {
  // adapt the existing mock of peluchAdminService.listAll to return one peluche
  // with is_active: false, then:
  expect(await screen.findByText('Borrador')).toBeInTheDocument()
})
```

> Adapt to the file's existing mock setup and fixture shape — match how other tests in this file mock `listAll`.

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd frontend && npx jest app/backoffice/peluches/__tests__/page.test.tsx -t "Borrador"`
Expected: FAIL — no "Borrador" text rendered.

- [ ] **Step 4: Render the badge**

Next to each peluche's title in the row, add (only when `!peluche.is_active`):

```tsx
{!p.is_active && (
  <span style={{ background: 'var(--cream-peach)', color: 'var(--terracotta)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.06em' }}>
    Borrador
  </span>
)}
```

(Use the row's actual peluche variable name in place of `p`.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npx jest app/backoffice/peluches/__tests__/page.test.tsx`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/backoffice/peluches/page.tsx frontend/app/backoffice/peluches/__tests__/page.test.tsx
git commit -m "feat(frontend): mark inactive peluches as Borrador in the backoffice list"
```

---

## Task 7: Full verification

- [ ] **Step 1: Run the full affected frontend test set**

Run: `cd frontend && npx jest lib/utils/__tests__/imageCompressor.test.ts lib/services/__tests__/colorImageUpload.test.ts lib/hooks/__tests__/useColorImageUpload.test.tsx components/admin/__tests__/PeluchForm.test.tsx app/backoffice/peluches/__tests__/page.test.tsx`
Expected: all PASS.

- [ ] **Step 2: Typecheck and lint**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: no increase versus the pre-feature baseline.

Run: `cd frontend && npx eslint lib/utils/imageCompressor.ts lib/services/colorImageUpload.ts lib/hooks/useColorImageUpload.ts components/admin/PeluchForm.tsx app/backoffice/peluches/page.tsx`
Expected: no new errors.

- [ ] **Step 3: Coverage gate for `lib/utils/`**

Run: `cd frontend && npx jest lib/utils`
Expected: PASS with no `Coverage ... threshold` failure (`imageCompressor.ts` must stay ≥90%).

- [ ] **Step 4: Manual browser verification**

Start backend and `npm run dev`. In `/backoffice/peluches/nuevo`: fill title + category, select colors, upload several photos per color — confirm each tile shows uploading → ✓, a draft appears in `/backoffice/peluches` as "Borrador", "Guardar" is disabled while uploads are pending, a forced failure shows ✗ + retry, and "Cancelar" offers to discard the draft.

- [ ] **Step 5: Run the E2E user-flows audit**

Per `CLAUDE.md`, this changes the backoffice peluche-creation flow. Invoke the `e2e-user-flows-check` skill and address any gap it reports.

- [ ] **Step 6: Update memory docs**

Add a note to `tasks/active_context.md` describing the draft-based incremental upload.

---

## Self-review notes

- **Spec coverage:** §4.1 draft model → Task 4; §4.2 backend unchanged → no backend task (correct); §4.3 compression → Task 1; §4.4 upload hook → Tasks 2-3; §4.5 status UI + save gating → Task 5; §4.6 edit mode unified → Tasks 4-5 (the hook seeds from `initialGallery` for `existing`); §4.7 orphan drafts → Task 5 (cancel deletes) + Task 6 (badge). §7 tests → every task.
- **Type consistency:** `ColorGalleryItem` is defined once in `useColorImageUpload.ts` (Task 3) and imported by `PeluchForm` (Task 4). `uploadColorImageWithRetry` (Task 2) is consumed by the hook (Task 3). `compressImage` / `ImageTooLargeError` / `TARGET_BYTES` (Task 1) consumed by the hook (Task 3) and its test.
- **Ordering:** Task 3 imports Tasks 1 & 2's modules; Task 4 imports Task 3's hook — keep the order.
- **Known follow-up for the executor:** Tasks 4-6 give complete code for new functions and precise anchored edits, but `PeluchForm.tsx` is large — verify each anchor against the live file before editing, and adjust test selectors to the live markup.
