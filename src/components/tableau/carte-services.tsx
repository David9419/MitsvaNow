"use client"

import { Check, ListFilter } from "lucide-react"

import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { cn } from "@/lib/utils"

/** Les services que l'intervenant accepte de rendre. */
export function CarteServices({
  services,
  onBasculer,
}: {
  services: { id: string; nom: string; propose: boolean }[]
  onBasculer: (id: string, propose: boolean) => void
}) {
  const aucun = services.every((s) => !s.propose)
  return (
    <CarteWidget icon={ListFilter} titre="Mes services" sousTitre="Ce que vous acceptez de faire" delai={400}>
      <div className="flex flex-wrap gap-2">
        {services.map((s) => {
          const actif = aucun || s.propose
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onBasculer(s.id, !s.propose)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all duration-300 active:scale-95",
                actif ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {actif && <Check className="size-3.5 animate-in zoom-in" />}
              {s.nom}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {aucun
          ? "Vous recevez tous les services de votre espace. Cliquez pour n'en garder que certains."
          : "Vous ne recevez que les services cochés."}
      </p>
    </CarteWidget>
  )
}
