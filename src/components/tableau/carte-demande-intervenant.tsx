"use client"

import { useState } from "react"
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Hourglass,
  Loader2,
  MapPin,
  MessageSquareQuote,
  Navigation,
  Phone,
  Play,
  Ruler,
  Timer,
  X,
} from "lucide-react"

import { Avatar } from "@/components/avatar"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { BadgeStatut } from "@/components/tableau/badge-statut"
import { ICONES_TRANSPORT } from "@/components/tableau/transport"
import { Button } from "@/components/ui/button"
import { useMaintenant } from "@/hooks/use-maintenant"
import { formaterDateHeure, formaterDistance, ilYa, nomService } from "@/lib/i18n"
import { lienItineraire } from "@/lib/tableau/outils"
import type { DemandeIntervenant } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

/** Temps laissé pour répondre (doit correspondre à expirer_demandes dans la base). */
const DELAI_REPONSE_MIN = 5
const DELAI_REPONSE_PROGRAMMEE_MIN = 120

export function CarteDemandeIntervenant({
  demande: d,
  onAccepter,
  onRefuser,
  onAvancer,
  onAnnuler,
  index = 0,
}: {
  demande: DemandeIntervenant
  onAccepter: (d: DemandeIntervenant) => void
  onRefuser: (id: string) => Promise<void>
  onAvancer: (id: string) => Promise<void>
  onAnnuler: (d: DemandeIntervenant) => void
  index?: number
}) {
  const t = useT()
  const c = t.intervenant.carte
  const langue = useLangue()
  const maintenant = useMaintenant()
  const [enCours, setEnCours] = useState<string | null>(null)
  const agir = async (cle: string, f: () => Promise<void>) => {
    setEnCours(cle)
    try {
      await f()
    } finally {
      setEnCours(null)
    }
  }
  const nouvelle = d.statut === "en_attente"
  const active = d.statut === "acceptee" || d.statut === "en_cours"
  const itineraire = d.lat != null || d.adresse ? lienItineraire(d.lat, d.lng, d.adresse) : null
  const nom = `${d.demandeur_prenom} ${d.demandeur_nom ?? ""}`.trim()
  const service = nomService(d.service_noms, d.service, langue)

  // Compte à rebours pour répondre
  const limite =
    nouvelle && d.attribuee_le
      ? new Date(d.attribuee_le).getTime() +
        (d.programmee_pour ? DELAI_REPONSE_PROGRAMMEE_MIN : DELAI_REPONSE_MIN) * 60000
      : null
  const minutesRestantes = limite ? Math.ceil((limite - maintenant) / 60000) : null
  const IconeTransport = d.transport ? ICONES_TRANSPORT[d.transport] : null

  return (
    <article
      className={cn(
        "group relative animate-in fade-in slide-in-from-bottom-3 overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-500 fill-mode-both hover:shadow-lg",
        nouvelle && "border-accent/60 shadow-md shadow-accent/10 ring-2 ring-accent/30"
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {nouvelle && (
        <span className="absolute start-0 top-0 h-1 w-full animate-pulse bg-gradient-to-r from-accent via-primary to-accent" />
      )}

      {/* Qui + service + statut */}
      <div className="flex items-start gap-3">
        <Avatar src={d.demandeur_photo} nom={nom} className="size-12 text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{nom}</p>
              <h3 className="font-heading text-base leading-snug font-bold text-primary">{service}</h3>
            </div>
            <BadgeStatut statut={d.statut} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Ruler className="size-3.5" /> {t.tableau.a(formaterDistance(d.distance_m, langue))}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {ilYa(d.created_at, langue)}
            </span>
          </p>
        </div>
      </div>

      {/* Demande programmée */}
      {d.programmee_pour && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
          <CalendarClock className="size-4 shrink-0" />
          <span className="first-letter:uppercase">{formaterDateHeure(d.programmee_pour, langue)}</span>
        </p>
      )}

      {d.adresse &&
        (itineraire ? (
          <a
            href={itineraire}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
            title={t.commun.itineraire}
          >
            <MapPin className="size-5 shrink-0 text-primary" />
            <span className="flex-1 font-medium underline-offset-4 hover:underline">{d.adresse}</span>
            <Navigation className="size-4 shrink-0 text-primary" />
          </a>
        ) : (
          <p className="mt-3 flex items-center gap-3 rounded-xl border p-3 text-sm">
            <MapPin className="size-5 shrink-0 text-primary" /> {d.adresse}
          </p>
        ))}

      {d.message && (
        <p className="mt-3 flex gap-2 rounded-xl bg-muted/60 p-3 text-sm">
          <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {d.message}
        </p>
      )}

      {/* Où en est la demande */}
      {nouvelle && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{c.telApres}</span>
          {minutesRestantes != null && (
            <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 font-semibold text-accent-foreground dark:text-accent">
              <Timer className="size-3.5" />
              {minutesRestantes > 0 ? c.repondreDans(minutesRestantes) : c.repondreBientot}
            </span>
          )}
        </div>
      )}
      {d.statut === "acceptee" && !d.confirmee && (
        <p className="mt-3 flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm font-medium">
          <Hourglass className="size-4 shrink-0 animate-pulse text-accent-foreground dark:text-accent" />
          {c.attenteConfirmation(d.demandeur_prenom)}
        </p>
      )}
      {d.statut === "acceptee" && d.confirmee && (
        <p className="mt-3 flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm font-medium text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          {c.confirmee}
        </p>
      )}
      {active && IconeTransport && (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <IconeTransport className="size-4 text-primary" />
          {t.transports[d.transport!]}
          {d.eta_minutes != null && ` · ${c.arriveeDans(d.eta_minutes)}`}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {nouvelle && (
          <>
            <Button
              onClick={() => onAccepter(d)}
              disabled={!!enCours}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Check />
              {c.accepter}
            </Button>
            <Button variant="outline" onClick={() => agir("non", () => onRefuser(d.id))} disabled={!!enCours}>
              {enCours === "non" ? <Loader2 className="animate-spin" /> : <X />}
              {c.pasDispo}
            </Button>
          </>
        )}
        {d.statut === "acceptee" && (
          <Button onClick={() => agir("go", () => onAvancer(d.id))} disabled={!!enCours || !d.confirmee}>
            {enCours === "go" ? <Loader2 className="animate-spin" /> : <Play className="rtl:-scale-x-100" />}
            {c.enRoute}
          </Button>
        )}
        {d.statut === "en_cours" && (
          <Button
            onClick={() => agir("fin", () => onAvancer(d.id))}
            disabled={!!enCours}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {enCours === "fin" ? <Loader2 className="animate-spin" /> : <Check />}
            {c.terminer}
          </Button>
        )}
        {active && itineraire && (
          <Button asChild variant="outline">
            <a href={itineraire} target="_blank" rel="noreferrer">
              <Navigation /> {t.commun.yAller}
            </a>
          </Button>
        )}
        {active && d.demandeur_telephone && (
          <Button asChild variant="outline">
            <a href={`tel:${d.demandeur_telephone}`}>
              <Phone /> {t.commun.appeler}
            </a>
          </Button>
        )}
        {active && (
          <Button
            variant="ghost"
            onClick={() => onAnnuler(d)}
            disabled={!!enCours}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:ms-auto"
          >
            <X /> {c.annuler}
          </Button>
        )}
      </div>
    </article>
  )
}
