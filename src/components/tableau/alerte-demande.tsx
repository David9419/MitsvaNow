"use client"

import Image from "next/image"
import { useState } from "react"
import { Check, Loader2, MapPin, Navigation, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formaterDistance, lienItineraire } from "@/lib/tableau/outils"
import type { DemandeIntervenant } from "@/lib/tableau/types"

/**
 * Message qui s'affiche dans le site quand une nouvelle demande arrive :
 * logo, prénom et nom, service, adresse, et les boutons Accepter / Pas disponible.
 */
export function AlerteDemande({
  demande: d,
  restantes,
  onRepondre,
  onFermer,
}: {
  demande: DemandeIntervenant
  restantes: number
  onRepondre: (id: string, accepter: boolean) => Promise<void>
  onFermer: () => void
}) {
  const [enCours, setEnCours] = useState<"oui" | "non" | null>(null)
  const repondre = async (accepter: boolean) => {
    setEnCours(accepter ? "oui" : "non")
    try {
      await onRepondre(d.id, accepter)
    } finally {
      setEnCours(null)
    }
  }

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 sm:left-auto sm:w-[26rem]">
      <div
        key={d.id}
        role="alertdialog"
        aria-label={`Nouvelle demande : ${d.service}`}
        className="entree-flou relative overflow-hidden rounded-3xl border bg-popover text-popover-foreground shadow-2xl ring-2 ring-accent/40"
      >
        <span className="absolute top-0 left-0 h-1 w-full animate-pulse bg-gradient-to-r from-accent via-primary to-accent" />

        {/* En-tête avec le logo */}
        <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-3">
          <Image src="/logo-mark.png" alt="" width={32} height={28} className="h-7 w-auto" />
          <div className="flex-1">
            <p className="font-heading text-sm font-bold">
              Mivtsa <span className="text-primary">Now</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Nouvelle demande d&apos;intervention{restantes > 0 && ` · +${restantes} autre${restantes > 1 ? "s" : ""}`}
            </p>
          </div>
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
          </span>
          <button
            type="button"
            onClick={onFermer}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fermer (la demande reste dans « À traiter »)"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Service demandé</p>
            <p className="font-heading text-lg font-bold">{d.service}</p>
          </div>

          <p className="flex items-center gap-3 text-sm">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="size-4" />
            </span>
            <span>
              <span className="block font-semibold">
                {d.demandeur_prenom} {d.demandeur_nom}
              </span>
              <span className="text-muted-foreground">à {formaterDistance(d.distance_m)} de vous</span>
            </span>
          </p>

          {d.adresse && (
            <a
              href={lienItineraire(d.lat, d.lng, d.adresse)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <MapPin className="size-5 shrink-0 text-primary" />
              <span className="flex-1 font-medium">{d.adresse}</span>
              <Navigation className="size-4 shrink-0 text-primary" />
            </a>
          )}

          {d.message && <p className="rounded-xl bg-muted/60 p-3 text-sm">« {d.message} »</p>}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              size="lg"
              onClick={() => repondre(true)}
              disabled={!!enCours}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {enCours === "oui" ? <Loader2 className="animate-spin" /> : <Check />}
              Accepter
            </Button>
            <Button size="lg" variant="outline" onClick={() => repondre(false)} disabled={!!enCours}>
              {enCours === "non" ? <Loader2 className="animate-spin" /> : <X />}
              Pas disponible
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
