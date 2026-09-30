"use client"

import { useState } from "react"
import { Check, Keyboard, Loader2, LocateFixed, MapPin, ShieldCheck } from "lucide-react"

import { RechercheAdresse } from "@/components/tableau/recherche-adresse"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"
import type { Position } from "@/hooks/use-localisation"
import { adresseDePosition } from "@/lib/tableau/adresses"

export type LieuValide = { lat: number; lng: number; adresse: string | null }

type Etape =
  | { nom: "intro" }
  | { nom: "gps" }
  | { nom: "trouve"; lieu: LieuValide; precision: number }
  | { nom: "adresse"; refus?: boolean }
  | { nom: "enregistrement" }

/**
 * Fenêtre qui active la localisation : GPS du téléphone / ordinateur,
 * adresse réelle retrouvée, ou adresse tapée à la main.
 */
export function FenetreLocalisation({
  ouverte,
  onFermer,
  activerGps,
  onValider,
  titre,
  texte,
}: {
  ouverte: boolean
  onFermer: () => void
  activerGps: () => Promise<Position | null>
  onValider: (lieu: LieuValide) => Promise<void>
  titre?: string
  texte: string
}) {
  const t = useT()
  const l = t.localisation
  const langue = useLangue()
  const [etape, setEtape] = useState<Etape>({ nom: "intro" })
  if (!ouverte) return null
  const titreAffiche = titre ?? l.titre

  const localiser = async () => {
    setEtape({ nom: "gps" })
    const p = await activerGps()
    if (!p) {
      setEtape({ nom: "adresse", refus: true })
      return
    }
    const adresse = await adresseDePosition(p.lat, p.lng, langue)
    setEtape({ nom: "trouve", lieu: { lat: p.lat, lng: p.lng, adresse }, precision: p.precision })
  }

  const valider = async (lieu: LieuValide) => {
    setEtape({ nom: "enregistrement" })
    try {
      await onValider(lieu)
      setEtape({ nom: "intro" })
      onFermer()
    } catch {
      setEtape({ nom: "adresse" })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 animate-in fade-in bg-background/60 backdrop-blur-md duration-500" onClick={onFermer} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titreAffiche}
        className="entree-flou relative w-full max-w-md overflow-hidden rounded-3xl border bg-popover p-7 text-popover-foreground shadow-2xl"
      >
        <div aria-hidden className="absolute -end-16 -top-16 size-48 animate-blob rounded-full bg-primary/15 blur-3xl" />

        {/* Icône animée */}
        <div className="relative mx-auto mb-5 flex size-20 items-center justify-center">
          {(etape.nom === "intro" || etape.nom === "gps") &&
            [0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute inset-0 animate-radar rounded-full border-2 border-primary/40"
                style={{ animationDelay: `${i}s` }}
              />
            ))}
          <span
            className={
              etape.nom === "trouve"
                ? "relative flex size-16 animate-in zoom-in items-center justify-center rounded-full bg-success text-success-foreground shadow-lg shadow-success/30"
                : "relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            }
          >
            {etape.nom === "trouve" ? (
              <Check className="size-8" />
            ) : etape.nom === "gps" || etape.nom === "enregistrement" ? (
              <Loader2 className="size-7 animate-spin" />
            ) : etape.nom === "adresse" ? (
              <Keyboard className="size-7" />
            ) : (
              <MapPin className="size-8" />
            )}
          </span>
        </div>

        <div key={etape.nom} className="entree-flou relative text-center">
          {etape.nom === "intro" && (
            <>
              <h2 className="text-xl font-bold">{titreAffiche}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{texte}</p>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-success" /> {l.jamaisAffichee}
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button size="lg" onClick={localiser} className="h-12 text-base">
                  <LocateFixed /> {l.meLocaliser}
                </Button>
                <Button variant="ghost" onClick={() => setEtape({ nom: "adresse" })}>
                  <Keyboard /> {l.taperAdresse}
                </Button>
              </div>
            </>
          )}

          {etape.nom === "gps" && (
            <>
              <h2 className="text-xl font-bold">{l.recherche}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {l.autoriserAvant} <strong>{l.autoriser}</strong>.
              </p>
            </>
          )}

          {etape.nom === "trouve" && (
            <>
              <h2 className="text-xl font-bold">{l.localise}</h2>
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-start">
                <MapPin className="mt-0.5 size-5 shrink-0 text-success" />
                <div>
                  <p className="font-semibold">{etape.lieu.adresse ?? l.positionTrouvee}</p>
                  <p className="text-xs text-muted-foreground">{l.precision(Math.round(etape.precision))}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Button size="lg" onClick={() => valider(etape.lieu)} className="h-12 text-base">
                  <Check /> {l.cestIci}
                </Button>
                <Button variant="ghost" onClick={() => setEtape({ nom: "adresse" })}>
                  {l.pasBonne}
                </Button>
              </div>
            </>
          )}

          {etape.nom === "adresse" && (
            <>
              <h2 className="text-xl font-bold">{l.votreAdresse}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {etape.refus ? l.refus : l.taperPuisChoisir}
              </p>
              <div className="mt-5 text-start">
                <RechercheAdresse autoFocus onChoisir={(s) => valider({ lat: s.lat, lng: s.lng, adresse: s.libelle })} />
              </div>
              <Button variant="ghost" className="mt-3" onClick={localiser}>
                <LocateFixed /> {l.reessayer}
              </Button>
            </>
          )}

          {etape.nom === "enregistrement" && <h2 className="text-xl font-bold">{l.enregistrement}</h2>}
        </div>

        {etape.nom !== "gps" && etape.nom !== "enregistrement" && (
          <button
            type="button"
            onClick={onFermer}
            className="relative mt-4 block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {t.commun.plusTard}
          </button>
        )}
      </div>
    </div>
  )
}
