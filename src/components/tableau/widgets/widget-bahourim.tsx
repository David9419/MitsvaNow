"use client"

import { useEffect, useState } from "react"
import { Backpack, Minus, Plus, Target } from "lucide-react"

import { Checklist } from "@/components/tableau/widgets/checklist"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { debutDeSemaine } from "@/lib/tableau/outils"
import type { DemandeIntervenant } from "@/lib/tableau/types"

/** Bahourim : objectif de mitsvot de la semaine + sac de mivtsa. */
export function WidgetBahourim({ demandes }: { demandes: DemandeIntervenant[] }) {
  const [objectif, setObjectif] = useState(7)
  useEffect(() => {
    const v = Number(localStorage.getItem("mn-objectif-semaine"))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local
    if (v > 0) setObjectif(v)
  }, [])
  const changer = (n: number) => {
    const v = Math.min(99, Math.max(1, n))
    setObjectif(v)
    localStorage.setItem("mn-objectif-semaine", String(v))
  }

  const lundi = debutDeSemaine()
  const faites = demandes.filter(
    (d) => d.statut === "terminee" && new Date(d.updated_at) >= lundi
  ).length
  const pct = Math.min(1, faites / objectif)
  const R = 52
  const C = 2 * Math.PI * R

  return (
    <>
      <CarteWidget icon={Target} titre="Objectif de la semaine" sousTitre="Mitsvot accomplies depuis lundi" delai={200}>
        <div className="flex flex-1 items-center gap-6">
          <div className="relative size-32 shrink-0">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
              <circle cx="60" cy="60" r={R} className="fill-none stroke-muted" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r={R}
                className="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000 ease-out"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-3xl font-bold">{faites}</span>
              <span className="text-xs text-muted-foreground">sur {objectif}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              {pct >= 1
                ? "Objectif atteint, bravo ! 🎉"
                : `Encore ${objectif - faites} pour atteindre votre objectif.`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Objectif</span>
              <button
                type="button"
                onClick={() => changer(objectif - 1)}
                className="flex size-7 items-center justify-center rounded-md border transition-all hover:bg-muted active:scale-90"
                aria-label="Diminuer l'objectif"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-6 text-center font-semibold tabular-nums">{objectif}</span>
              <button
                type="button"
                onClick={() => changer(objectif + 1)}
                className="flex size-7 items-center justify-center rounded-md border transition-all hover:bg-muted active:scale-90"
                aria-label="Augmenter l'objectif"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </CarteWidget>

      <CarteWidget icon={Backpack} titre="Mon sac de mivtsa" sousTitre="Tout est prêt avant de partir ?" delai={300}>
        <Checklist
          cle="mn-sac-mivtsa"
          elements={["Téfilines", "Mezouzot et clous", "Boîtes de tsédaka", "Siddourim et livres", "Kippa", "Téléphone chargé"]}
        />
      </CarteWidget>
    </>
  )
}
