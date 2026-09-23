import { GraduationCap, Sprout } from "lucide-react"

import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { ilYa } from "@/lib/tableau/outils"
import type { DemandeIntervenant } from "@/lib/tableau/types"

/** Chaliah : les personnes accompagnées (« élèves ») et leur progression. */
export function WidgetChaliah({ demandes }: { demandes: DemandeIntervenant[] }) {
  const eleves = new Map<string, { nom: string; seances: number; derniere: string }>()
  demandes
    .filter((d) => d.demandeur_id && (d.statut === "terminee" || d.statut === "en_cours" || d.statut === "acceptee"))
    .forEach((d) => {
      const e = eleves.get(d.demandeur_id!)
      const nom = `${d.demandeur_prenom} ${d.demandeur_nom ?? ""}`.trim()
      if (!e) eleves.set(d.demandeur_id!, { nom, seances: d.statut === "terminee" ? 1 : 0, derniere: d.updated_at })
      else {
        if (d.statut === "terminee") e.seances++
        if (d.updated_at > e.derniere) e.derniere = d.updated_at
      }
    })
  const liste = [...eleves.values()].sort((a, b) => b.derniere.localeCompare(a.derniere))
  const paliers = [1, 3, 5, 10]

  return (
    <>
      <CarteWidget
        icon={GraduationCap}
        titre="Mes élèves"
        sousTitre="Les personnes que vous accompagnez"
        delai={200}
        action={<span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{liste.length}</span>}
      >
        {liste.length === 0 ? (
          <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            Les personnes que vous accompagnerez apparaîtront ici, avec leur progression.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {liste.map((e, i) => {
              const palier = paliers.find((p) => e.seances < p) ?? e.seances
              return (
                <li
                  key={i}
                  className="animate-in fade-in slide-in-from-right-2 flex items-center gap-3 fill-mode-both"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {e.nom.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate font-semibold">{e.nom}</span>
                      <span className="text-xs text-muted-foreground">{ilYa(e.derniere)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-1000"
                          style={{ width: `${Math.min(100, (e.seances / palier) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {e.seances} séance{e.seances > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CarteWidget>

      <CarteWidget icon={Sprout} titre="L'esprit du chaliah" delai={300}>
        <blockquote className="border-l-4 border-primary pl-4 text-sm leading-relaxed text-muted-foreground italic">
          Éduquer sans imposer : accompagner chacun à son rythme, avec douceur,
          vers la découverte de la Torah.
        </blockquote>
      </CarteWidget>
    </>
  )
}
