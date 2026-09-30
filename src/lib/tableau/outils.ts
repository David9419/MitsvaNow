import {
  CheckCircle2,
  CircleX,
  Hourglass,
  PlayCircle,
  ThumbsUp,
  TimerOff,
  type LucideIcon,
} from "lucide-react"

import type { Dico } from "@/lib/i18n"
import type { StatutDemande } from "@/lib/tableau/types"

export { formaterDistance, ilYa } from "@/lib/i18n"

export const STATUTS: Record<StatutDemande, { icon: LucideIcon; classe: string }> = {
  en_attente: { icon: Hourglass, classe: "bg-accent/15 text-accent-foreground ring-accent/40 dark:text-accent" },
  acceptee: { icon: ThumbsUp, classe: "bg-primary/10 text-primary ring-primary/30" },
  en_cours: { icon: PlayCircle, classe: "bg-primary text-primary-foreground ring-primary" },
  terminee: { icon: CheckCircle2, classe: "bg-success/15 text-success ring-success/30" },
  annulee: { icon: CircleX, classe: "bg-muted text-muted-foreground ring-border" },
  expiree: { icon: TimerOff, classe: "bg-muted text-muted-foreground ring-border" },
}

/**
 * Lien d'itinéraire vers une adresse : Plans sur iPhone / iPad / Mac,
 * Google Maps ailleurs.
 */
export function lienItineraire(lat: number | null, lng: number | null, adresse?: string | null) {
  const apple = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
  const destination = lat != null && lng != null ? `${lat},${lng}` : encodeURIComponent(adresse ?? "")
  return apple
    ? `https://maps.apple.com/?daddr=${destination}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`
}

export function debutDeSemaine(date = new Date()) {
  const d = new Date(date)
  const jour = (d.getDay() + 6) % 7 // lundi = 0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - jour)
  return d
}

/** Traduit une erreur Supabase en message simple, dans la bonne langue. */
export function messageErreur(e: unknown, t: Dico) {
  const m = (e as { message?: string })?.message ?? ""
  if (!m) return t.commun.erreur
  if (/fetch|network/i.test(m)) return t.commun.reseau
  return t.erreursBase[m] ?? m
}
