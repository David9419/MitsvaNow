"use client"

import { useState } from "react"
import { Check, Clock, Loader2, MapPin, MessageSquareQuote, Navigation, Phone, Play, Ruler, User, X } from "lucide-react"

import { BadgeStatut } from "@/components/tableau/badge-statut"
import { Button } from "@/components/ui/button"
import { formaterDistance, ilYa, lienItineraire } from "@/lib/tableau/outils"
import type { DemandeIntervenant } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

export function CarteDemandeIntervenant({
  demande: d,
  onRepondre,
  onAvancer,
  index = 0,
}: {
  demande: DemandeIntervenant
  onRepondre: (id: string, accepter: boolean) => Promise<void>
  onAvancer: (id: string) => Promise<void>
  index?: number
}) {
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
  const active = d.statut !== "terminee" && d.statut !== "annulee"
  const itineraire = d.lat != null || d.adresse ? lienItineraire(d.lat, d.lng, d.adresse) : null

  return (
    <article
      className={cn(
        "group relative animate-in fade-in slide-in-from-bottom-3 overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-500 fill-mode-both hover:shadow-lg",
        nouvelle && "border-accent/60 shadow-md shadow-accent/10 ring-2 ring-accent/30"
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {nouvelle && (
        <span className="absolute top-0 left-0 h-1 w-full animate-pulse bg-gradient-to-r from-accent via-primary to-accent" />
      )}

      {/* Service + statut */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Service demandé</p>
          <h3 className="font-heading text-lg font-bold">{d.service}</h3>
        </div>
        <BadgeStatut statut={d.statut} />
      </div>

      {/* Qui, où, quand */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <p className="flex items-center gap-2 text-sm">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-4" />
          </span>
          <span className="font-semibold">
            {d.demandeur_prenom} {d.demandeur_nom}
          </span>
        </p>
        <p className="flex items-center gap-3 text-sm text-muted-foreground sm:justify-end">
          <span className="flex items-center gap-1">
            <Ruler className="size-3.5" /> à {formaterDistance(d.distance_m)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {ilYa(d.created_at)}
          </span>
        </p>
      </div>

      {d.adresse &&
        (itineraire ? (
          <a
            href={itineraire}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
            title="Ouvrir l'itinéraire"
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
      {nouvelle && (
        <p className="mt-3 text-xs text-muted-foreground">Le téléphone s&apos;affichera quand vous aurez accepté.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {d.statut === "en_attente" && (
          <>
            <Button
              onClick={() => agir("oui", () => onRepondre(d.id, true))}
              disabled={!!enCours}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {enCours === "oui" ? <Loader2 className="animate-spin" /> : <Check />}
              Accepter
            </Button>
            <Button variant="outline" onClick={() => agir("non", () => onRepondre(d.id, false))} disabled={!!enCours}>
              {enCours === "non" ? <Loader2 className="animate-spin" /> : <X />}
              Pas disponible
            </Button>
          </>
        )}
        {d.statut === "acceptee" && (
          <Button onClick={() => agir("go", () => onAvancer(d.id))} disabled={!!enCours}>
            {enCours === "go" ? <Loader2 className="animate-spin" /> : <Play />}
            Je suis en route
          </Button>
        )}
        {d.statut === "en_cours" && (
          <Button
            onClick={() => agir("fin", () => onAvancer(d.id))}
            disabled={!!enCours}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {enCours === "fin" ? <Loader2 className="animate-spin" /> : <Check />}
            Mission terminée
          </Button>
        )}
        {active && itineraire && (
          <Button asChild variant="outline">
            <a href={itineraire} target="_blank" rel="noreferrer">
              <Navigation /> Y aller
            </a>
          </Button>
        )}
        {active && d.demandeur_telephone && (
          <Button asChild variant="outline">
            <a href={`tel:${d.demandeur_telephone}`}>
              <Phone /> Appeler
            </a>
          </Button>
        )}
      </div>
    </article>
  )
}
