"use client"

import { Loader2, LocateFixed, MapPin, Radar as RadarIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import type { EtatLocalisation } from "@/hooks/use-localisation"

/** Position + rayon d'intervention. */
export function CarteLocalisation({
  etat,
  aUnePosition,
  rayon,
  onActiver,
  onRayon,
}: {
  etat: EtatLocalisation
  aUnePosition: boolean
  rayon: number
  onActiver: () => void
  onRayon: (km: number) => void
}) {
  const [valeur, setValeur] = useState(rayon)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- suit la valeur enregistrée
    setValeur(rayon)
  }, [rayon])

  const libelle = {
    active: { t: "Localisation active", c: "text-success", pulse: true },
    demande: { t: "Recherche de votre position…", c: "text-muted-foreground", pulse: false },
    refusee: { t: "Localisation bloquée par le navigateur", c: "text-destructive", pulse: false },
    indisponible: { t: "Localisation indisponible", c: "text-destructive", pulse: false },
    inconnu: { t: aUnePosition ? "Dernière position enregistrée" : "Localisation non activée", c: "text-muted-foreground", pulse: false },
  }[etat]

  return (
    <CarteWidget icon={MapPin} titre="Ma zone d'intervention" sousTitre="Où vous recevez des demandes" delai={100}>
      <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
        <span className={`flex items-center gap-2 text-sm font-medium ${libelle.c}`}>
          <span className="relative flex size-2.5">
            {libelle.pulse && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />}
            <span className="relative inline-flex size-2.5 rounded-full bg-current" />
          </span>
          {libelle.t}
        </span>
        <Button size="sm" variant="outline" onClick={onActiver} disabled={etat === "demande"}>
          {etat === "demande" ? <Loader2 className="animate-spin" /> : <LocateFixed />}
          {etat === "active" ? "Actualiser" : "Activer"}
        </Button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-medium">
            <RadarIcon className="size-4 text-primary" /> Rayon d&apos;intervention
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary tabular-nums">
            {valeur} km
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={valeur}
          onChange={(e) => setValeur(Number(e.target.value))}
          onPointerUp={() => valeur !== rayon && onRayon(valeur)}
          onKeyUp={() => valeur !== rayon && onRayon(valeur)}
          className="w-full cursor-pointer accent-primary"
          aria-label="Rayon d'intervention en kilomètres"
        />
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </div>

      {/* Petit radar : la zone grandit avec le rayon */}
      <div className="relative mt-auto flex min-h-36 flex-1 items-center justify-center overflow-hidden rounded-xl bg-muted/40 pt-4">
        <div className="relative size-32">
          {[100, 66, 33].map((t) => (
            <span
              key={t}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15"
              style={{ width: `${t}%`, height: `${t}%` }}
            />
          ))}
          <span
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 ring-2 ring-primary/40 transition-all duration-700 ease-out"
            style={{ width: `${20 + (valeur / 50) * 80}%`, height: `${20 + (valeur / 50) * 80}%` }}
          />
          {etat === "active" && (
            <span className="absolute inset-0 animate-sweep rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_290deg,color-mix(in_oklab,var(--primary)_35%,transparent)_360deg)]" />
          )}
          <span className="absolute top-1/2 left-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <MapPin className="size-3.5" />
          </span>
        </div>
        <span className="absolute bottom-2 left-3 text-[11px] text-muted-foreground">
          Zone de {valeur} km autour de vous
        </span>
      </div>
    </CarteWidget>
  )
}
