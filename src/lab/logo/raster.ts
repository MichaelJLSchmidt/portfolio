/*
 * Rasterising a standalone SVG string: into a canvas of exact device pixels
 * (the pixel-true view) and into PNG files (downloads). Browser only.
 */
export async function svgImage(svg: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.decoding = 'async'
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  return img
}

/** Draw `svg` (written at width × height) into `canvas` at exactly that many pixels. */
export async function drawInto(canvas: HTMLCanvasElement, svg: string, width: number, height: number, ground?: string) {
  const img = await svgImage(svg)
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  if (ground) {
    ctx.fillStyle = ground
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(img, 0, 0, width, height)
}

export async function pngBlob(svg: string, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  await drawInto(canvas, svg, width, height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG failed'))), 'image/png'),
  )
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const saveText = (text: string, name: string, type = 'image/svg+xml') =>
  saveBlob(new Blob([text], { type }), name)
