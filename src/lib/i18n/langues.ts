/** Les 3 langues du site. */
export type Langue = "fr" | "he" | "en"

/** Chaque langue est écrite dans sa propre langue (« bienvenue » s'affiche pendant le changement). */
export const LANGUES: { code: Langue; nom: string; drapeau: string; bienvenue: string }[] = [
  { code: "fr", nom: "Français", drapeau: "🇫🇷", bienvenue: "Bienvenue" },
  { code: "he", nom: "עברית", drapeau: "🇮🇱", bienvenue: "ברוכים הבאים" },
  { code: "en", nom: "English", drapeau: "🇬🇧", bienvenue: "Welcome" },
]

export const LANGUE_PAR_DEFAUT: Langue = "fr"

/** Nom du cookie qui retient la langue choisie. */
export const COOKIE_LANGUE = "langue"

export function estLangue(v: unknown): v is Langue {
  return v === "fr" || v === "he" || v === "en"
}

/** L'hébreu se lit de droite à gauche. */
export function direction(l: Langue) {
  return l === "he" ? "rtl" : "ltr"
}

/** Format des dates et des nombres. */
export const LOCALES: Record<Langue, string> = { fr: "fr-FR", he: "he-IL", en: "en-GB" }
