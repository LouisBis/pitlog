/** Computes output dimensions that fit within maxDimension on the longer side, preserving aspect ratio. */
export function scaledDimensions(width: number, height: number, maxDimension: number): { width: number; height: number } {
  const longerSide = Math.max(width, height)
  if (longerSide <= maxDimension) return { width, height }
  const ratio = maxDimension / longerSide
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('file_read_failed'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image_decode_failed'))
    img.src = src
  })
}

/** Resizes an image file to fit within maxDimension (longer side) and re-encodes it as a JPEG data URI. */
export async function resizeImage(file: File, maxDimension = 1200, quality = 0.8): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('invalid_file_type')
  }

  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImage(dataUrl)
  const { width, height } = scaledDimensions(img.naturalWidth, img.naturalHeight, maxDimension)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unsupported')
  ctx.drawImage(img, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}
