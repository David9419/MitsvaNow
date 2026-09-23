"use client"

import { useState } from "react"
import { Check, Loader2, MapPin, Phone, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { libelleType, trouverEspace } from "@/lib/espaces"
import { formaterDistance, ilYa } from "@/lib/tableau/outils"
import type { DemandeDemandeur } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

const ETAPES = [
  { statut: "en_attente", label: "Recherche" },
  { statut: "acceptee", label: "Acceptée" },
  { statut: "en_cours", label: "En route" },
  { statut: "terminee", label: "Terminée" },
] as const

/** Suivi en direct d'une demande en cours. */
export function SuiviDemande({
  demande: d,
  onAnnuler,
}: {
  demande: DemandeDemandeur
  onAnnuler: (id: string) => Promise<void>
}) {
  const [annulation, setAnnulation] = useState(false)
  const etape = ETAPES.findIndex((e) => e.statut === d.statut)
  const espace = trouverEspace(d.espace_slug)
  const Icone = espace?.icon ?? MapPin

  return (
    <article className="relative animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-3xl border bg-card p-6 shadow-lg duration-700">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icone className="size-6" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{d.espace_nom}</p>
            <h3 className="font-heading text-lg font-bold">{d.service}</h3>
            <p className="text-xs text-muted-foreground">Demandée {ilYa(d.created_at)}</p>
          </div>
        </div>
        {(d.statut === "en_attente" || d.statut === "acceptee") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={annulation}
            onClick={async () => {
              setAnnulation(true)
              await onAnnuler(d.id)
              setAnnulation(false)
            }}
          >
            {annulation ? <Loader2 className="animate-spin" /> : <X />} Annuler
          </Button>
        )}
      </div>

      {/* Frise des étapes */}
      <ol className="relative mt-6 grid grid-cols-4">
        <div className="absolute top-4 right-[12.5%] left-[12.5%] h-1 rounded-full bg-muted" />
        <div
          className="absolute top-4 left-[12.5%] h-1 rounded-full bg-gradient-to-r from-primary to-success transition-all duration-1000 ease-out"
          style={{ width: `${(Math.max(0, etape) / 3) * 75}%` }}
        />
        {ETAPES.map((e, i) => {
          const fait = i < etape
          const actuel = i === etape
          return (
            <li key={e.statut} className="relative flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-full border-2 bg-card text-xs font-bold transition-all duration-500",
                  fait && "border-success bg-success text-success-foreground",
                  actuel && "scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                  !fait && !actuel && "border-border text-muted-foreground"
                )}
              >
                {actuel && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />}
                {fait ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("text-xs font-medium", actuel ? "text-foreground" : "text-muted-foreground")}>
                {e.label}
              </span>
            </li>
          )
        })}
      </ol>

      {/* Détail selon le statut */}
      <div className="mt-6">
        {d.statut === "en_attente" ? (
          <div className="flex items-center gap-4 rounded-2xl bg-primary/5 p-4">
            <div className="relative size-14 shrink-0">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute inset-0 animate-radar rounded-full border-2 border-primary/50"
                  style={{ animationDelay: `${i}s` }}
                />
              ))}
              <span className="absolute inset-3 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                <MapPin className="size-4" />
              </span>
            </div>
            <div>
              <p className="font-semibold">
                {d.intervenant_trouve ? "Un intervenant proche a été trouvé" : "Recherche de l'intervenant le plus proche…"}
              </p>
              <p className="text-sm text-muted-foreground">
                {d.intervenant_trouve
                  ? "Il doit confirmer. Vous serez prévenu dès qu'il accepte."
                  : "Personne n'est disponible pour l'instant près de vous. Nous continuons à chercher automatiquement."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-success/10 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-success text-success-foreground">
                <User className="size-6" />
              </span>
              <div>
                <p className="font-semibold">
                  {d.intervenant_prenom} · {libelleType(d.intervenant_type)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {d.statut === "acceptee" ? "a accepté votre demande" : "est en route vers vous"}
                  {d.distance_m != null && ` · à ${formaterDistance(d.distance_m)}`}
                </p>
              </div>
            </div>
            {d.intervenant_telephone && (
              <Button asChild className="bg-success text-success-foreground hover:bg-success/90">
                <a href={`tel:${d.intervenant_telephone}`}>
                  <Phone /> Appeler
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
