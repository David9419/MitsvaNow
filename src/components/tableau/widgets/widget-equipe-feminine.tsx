"use client"

import { HeartHandshake, ListChecks } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import { BadgeStatut } from "@/components/tableau/badge-statut"
import { Checklist } from "@/components/tableau/widgets/checklist"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { ilYa, nomService } from "@/lib/i18n"
import type { DemandeIntervenant } from "@/lib/tableau/types"

/** Équipe féminine : préparation de Chabbat + visites récentes. */
export function WidgetEquipeFeminine({ demandes }: { demandes: DemandeIntervenant[] }) {
  const t = useT()
  const w = t.widgets
  const langue = useLangue()
  const visites = demandes
    .filter((d) => ["acceptee", "en_cours", "terminee"].includes(d.statut))
    .slice(0, 5)
  return (
    <>
      <CarteWidget icon={ListChecks} titre={w.chabbatTitre} sousTitre={w.chabbatSous} delai={200}>
        <Checklist cle="mn-prepa-chabbat-v2" elements={w.chabbat} />
      </CarteWidget>

      <CarteWidget icon={HeartHandshake} titre={w.visitesTitre} sousTitre={w.visitesSous} delai={300}>
        {visites.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            {w.visitesVide}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visites.map((d, i) => (
              <li
                key={d.id}
                className="flex animate-in fade-in slide-in-from-right-2 items-center justify-between gap-3 rounded-xl border p-3 fill-mode-both rtl:slide-in-from-left-2"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {d.demandeur_prenom} {d.demandeur_nom}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {nomService(d.service_noms, d.service, langue)} · {ilYa(d.updated_at, langue)}
                  </p>
                </div>
                <BadgeStatut statut={d.statut} />
              </li>
            ))}
          </ul>
        )}
      </CarteWidget>
    </>
  )
}
