"use client"

/**
 * Réduit une photo (max 640 px, JPEG) avant de l'envoyer :
 * l'envoi est rapide, même en 4G, et le stockage reste léger.
 */
export async function compresserPhoto(fichier: File, taille = 640): Promise<Blob> {
  const url = URL.createObjectURL(fichier)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const echelle = Math.min(1, taille / Math.max(img.naturalWidth, img.naturalHeight))
    const l = Math.max(1, Math.round(img.naturalWidth * echelle))
    const h = Math.max(1, Math.round(img.naturalHeight * echelle))
    const canvas = document.createElement("canvas")
    canvas.width = l
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas")
    ctx.drawImage(img, 0, 0, l, h)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("photo"))), "image/jpeg", 0.85)
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function blobEnDataUrl(b: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(b)
  })
}
