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
