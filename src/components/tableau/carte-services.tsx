"use client"

import { ListFilter } from "lucide-react"

import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

/** Les services que l'intervenant accepte de rendre (4 par espace). */
export function CarteServices({
  services,
  onChanger,
}: {
  services: { id: string; nom: string; propose: boolean }[]
  /** Reçoit la liste des services gardés */
  onChanger: (idsActifs: string[]) => void
}) {
  // Aucun service coché = tous les services de l'espace
  const aucun = services.every((s) => !s.propose)
  const actifs = services.filter((s) => aucun || s.propose).map((s) => s.id)
  const nbActifs = actifs.length

  const basculer = (id: string, garder: boolean) => {
    const suivant = garder ? [...actifs, id] : actifs.filter((x) => x !== id)
    if (suivant.length === 0) return // au moins un service
    onChanger(suivant)
  }

  return (
    <CarteWidget
      icon={ListFilter}
      titre="Mes services"
      sousTitre="Ce que les demandeurs peuvent vous demander"
      delai={400}
      action={
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary tabular-nums">
          {nbActifs}/{services.length}
        </span>
      }
    >
      <ul className="flex flex-col gap-2">
        {services.map((s, i) => {
          const actif = aucun || s.propose
          return (
            <li
              key={s.id}
              className="animate-in fade-in slide-in-from-right-2 fill-mode-both"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm font-medium transition-all duration-300",
                  actif ? "border-primary/40 bg-primary/5" : "text-muted-foreground"
                )}
              >
                {s.nom}
                <Switch
                  checked={actif}
                  onCheckedChange={(v) => basculer(s.id, v)}
                  disabled={actif && nbActifs === 1}
                  aria-label={s.nom}
                />
              </label>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        {aucun
          ? "Vous recevez les 4 services de votre espace. Désactivez ceux que vous ne faites pas."
          : "Vous ne recevez que les services activés."}
      </p>
    </CarteWidget>
  )
}
