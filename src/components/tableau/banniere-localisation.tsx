"use client"

import { useState } from "react"
import { Loader2, MapPin, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { EtatLocalisation } from "@/hooks/use-localisation"

/**
 * Notification qui apparaît à l'arrivée sur le tableau de bord
 * pour activer la localisation.
 */
export function BanniereLocalisation({
  etat,
  onActiver,
  texte,
}: {
  etat: EtatLocalisation
  onActiver: () => void
  texte: string
}) {
  const [fermee, setFermee] = useState(false)
  if (fermee || etat === "active" || etat === "indisponible") return null

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-8 duration-700 sm:right-6 sm:bottom-6 sm:left-auto sm:w-96">
      <div className="relative overflow-hidden rounded-2xl border bg-popover p-5 text-popover-foreground shadow-2xl ring-1 ring-primary/20">
        <div aria-hidden className="absolute -top-10 -right-10 size-32 animate-blob rounded-full bg-primary/15 blur-2xl" />
        <button
          type="button"
          onClick={() => setFermee(true)}
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </button>
        <div className="relative flex gap-4">
          <div className="relative flex size-12 shrink-0 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
            <span className="relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MapPin className="size-6" />
            </span>
          </div>
          <div className="flex-1 pr-4">
            <p className="font-semibold">Activez votre localisation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {etat === "refusee"
                ? "La localisation est bloquée. Autorisez-la dans les réglages de votre navigateur (icône à gauche de l'adresse du site), puis réessayez."
                : texte}
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={onActiver} disabled={etat === "demande"}>
                {etat === "demande" ? <Loader2 className="animate-spin" /> : <MapPin />}
                {etat === "refusee" ? "Réessayer" : "Activer"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setFermee(true)}>
                Plus tard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
