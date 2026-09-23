/**
 * Recherche d'adresses avec OpenStreetMap (Nominatim), gratuit.
 * Utilisé depuis le navigateur de l'utilisateur.
 */
export type Suggestion = { libelle: string; lat: number; lng: number }

const BASE = "https://nominatim.openstreetmap.org"

export async function chercherAdresses(texte: string, signal?: AbortSignal): Promise<Suggestion[]> {
  const url = `${BASE}/search?format=json&limit=5&addressdetails=0&accept-language=fr&q=${encodeURIComponent(texte)}`
  const r = await fetch(url, { signal, headers: { Accept: "application/json" } })
  if (!r.ok) return []
  const data: { display_name: string; lat: string; lon: string }[] = await r.json()
  return data.map((d) => ({ libelle: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }))
}

export async function adresseDePosition(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(`${BASE}/reverse?format=json&zoom=18&accept-language=fr&lat=${lat}&lon=${lng}`)
    if (!r.ok) return null
    const d: { display_name?: string; address?: Record<string, string> } = await r.json()
    const a = d.address
    if (a) {
      const rue = [a.house_number, a.road].filter(Boolean).join(" ")
      const ville = a.city ?? a.town ?? a.village ?? a.municipality
      const court = [rue, a.postcode, ville].filter(Boolean).join(", ")
      if (court) return court
    }
    return d.display_name ?? null
  } catch {
    return null
  }
}

/** Nom de la ville d'une position (ex. « Paris »). */
export async function villeDePosition(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(`${BASE}/reverse?format=json&zoom=10&accept-language=fr&lat=${lat}&lon=${lng}`)
    if (!r.ok) return null
    const d: { address?: Record<string, string> } = await r.json()
    const a = d.address
    return a ? (a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? null) : null
  } catch {
    return null
  }
}
