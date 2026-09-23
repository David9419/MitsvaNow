import { HeartHandshake, ListChecks } from "lucide-react"

import { BadgeStatut } from "@/components/tableau/badge-statut"
import { Checklist } from "@/components/tableau/widgets/checklist"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { ilYa } from "@/lib/tableau/outils"
import type { DemandeIntervenant } from "@/lib/tableau/types"

/** Équipe féminine : préparation de Chabbat + visites récentes. */
export function WidgetEquipeFeminine({ demandes }: { demandes: DemandeIntervenant[] }) {
  const visites = demandes.filter((d) => d.statut !== "en_attente" && d.statut !== "annulee").slice(0, 5)
  return (
    <>
      <CarteWidget icon={ListChecks} titre="Préparation de Chabbat" sousTitre="Pour les 'hallot et les visites" delai={200}>
        <Checklist
          cle="mn-prepa-chabbat"
          elements={["Farine, levure, sucre, sel", "Pâte à 'hallot pétrie", "Bougies et allumettes", "Recette du prélèvement de la 'hala", "Sacs pour les livraisons"]}
        />
      </CarteWidget>

      <CarteWidget icon={HeartHandshake} titre="Mes visites" sousTitre="Les familles que vous aidez" delai={300}>
        {visites.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            Vos visites apparaîtront ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visites.map((d, i) => (
              <li
                key={d.id}
                className="flex animate-in fade-in slide-in-from-right-2 items-center justify-between gap-3 rounded-xl border p-3 fill-mode-both"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {d.demandeur_prenom} {d.demandeur_nom}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.service} · {ilYa(d.updated_at)}
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
