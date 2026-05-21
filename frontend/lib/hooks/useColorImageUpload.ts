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
