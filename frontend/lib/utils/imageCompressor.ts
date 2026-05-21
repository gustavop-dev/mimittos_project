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
