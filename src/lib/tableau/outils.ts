import {
  CheckCircle2,
  CircleX,
  Hourglass,
  PlayCircle,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react"

import type { StatutDemande } from "@/lib/tableau/types"

/** « 350 m », « 2,4 km » */
export function formaterDistance(metres: number | null | undefined) {
  if (metres == null) return "—"
  if (metres < 1000) return `${Math.max(10, Math.round(metres / 10) * 10)} m`
  return `${(metres / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`
}

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" })

/** « il y a 5 minutes », « hier »… */
export function ilYa(date: string | Date) {
  const secondes = Math.round((new Date(date).getTime() - Date.now()) / 1000)
  const abs = Math.abs(secondes)
  if (abs < 45) return "à l'instant"
  if (abs < 3600) return rtf.format(Math.round(secondes / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(secondes / 3600), "hour")
  if (abs < 86400 * 30) return rtf.format(Math.round(secondes / 86400), "day")
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
}

export const STATUTS: Record<
  StatutDemande,
  { label: string; icon: LucideIcon; classe: string }
> = {
  en_attente: { label: "En attente", icon: Hourglass, classe: "bg-accent/15 text-accent-foreground ring-accent/40 dark:text-accent" },
  acceptee: { label: "Acceptée", icon: ThumbsUp, classe: "bg-primary/10 text-primary ring-primary/30" },
  en_cours: { label: "En cours", icon: PlayCircle, classe: "bg-primary text-primary-foreground ring-primary" },
  terminee: { label: "Terminée", icon: CheckCircle2, classe: "bg-success/15 text-success ring-success/30" },
  annulee: { label: "Annulée", icon: CircleX, classe: "bg-muted text-muted-foreground ring-border" },
}

/** Lien d'itinéraire (Google Maps ou Waze sur téléphone) */
export function lienItineraire(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export function debutDeSemaine(date = new Date()) {
  const d = new Date(date)
  const jour = (d.getDay() + 6) % 7 // lundi = 0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - jour)
  return d
}

/** Traduit une erreur Supabase en message simple. */
export function messageErreur(e: unknown) {
  const m = (e as { message?: string })?.message ?? ""
  if (!m) return "Une erreur est survenue. Réessayez."
  if (/fetch|network/i.test(m)) return "Impossible de joindre le serveur. Vérifiez votre connexion."
  return m
}
