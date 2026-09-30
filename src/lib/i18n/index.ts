import { en } from "@/lib/i18n/en"
import { fr, type Dico } from "@/lib/i18n/fr"
import { he } from "@/lib/i18n/he"
import { LOCALES, type Langue } from "@/lib/i18n/langues"

export type { Dico } from "@/lib/i18n/fr"
export * from "@/lib/i18n/langues"

export const DICTIONNAIRES: Record<Langue, Dico> = { fr, he, en }

// ---------- Mise en forme selon la langue ----------

/** « 350 m », « 2,4 km » */
export function formaterDistance(metres: number | null | undefined, l: Langue) {
  if (metres == null) return "—"
  const t = DICTIONNAIRES[l].commun
  if (metres < 1000) return `${Math.max(10, Math.round(metres / 10) * 10)} ${t.metres}`
  return `${(metres / 1000).toLocaleString(LOCALES[l], { maximumFractionDigits: 1 })} ${t.kilometres}`
}

/** « il y a 5 minutes », « hier »… */
export function ilYa(date: string | Date, l: Langue) {
  const rtf = new Intl.RelativeTimeFormat(l, { numeric: "auto" })
  const secondes = Math.round((new Date(date).getTime() - Date.now()) / 1000)
  const abs = Math.abs(secondes)
  if (abs < 45) return DICTIONNAIRES[l].commun.instant
  if (abs < 3600) return rtf.format(Math.round(secondes / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(secondes / 3600), "hour")
  if (abs < 86400 * 30) return rtf.format(Math.round(secondes / 86400), "day")
  return new Date(date).toLocaleDateString(LOCALES[l], { day: "numeric", month: "long" })
}

/** « mardi 3 octobre à 14:30 » */
export function formaterDateHeure(date: string | Date, l: Langue) {
  return new Date(date).toLocaleString(LOCALES[l], {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** « 14:30 » */
export function formaterHeure(date: string | Date, l: Langue) {
  return new Date(date).toLocaleTimeString(LOCALES[l], { hour: "2-digit", minute: "2-digit" })
}

/** Nom d'un service dans la bonne langue (la base renvoie les 3). */
export function nomService(noms: Partial<Record<Langue, string>> | null | undefined, repli: string, l: Langue) {
  return noms?.[l] || noms?.fr || repli
}
