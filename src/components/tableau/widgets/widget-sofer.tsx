import { BarChart3, CalendarClock, Phone } from "lucide-react"

import { BadgeStatut } from "@/components/tableau/badge-statut"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { ilYa } from "@/lib/tableau/outils"
import type { DemandeIntervenant } from "@/lib/tableau/types"

/** Sofer / Rav / Rabbanit : consultations par service + prochains rendez-vous. */
export function WidgetSofer({ demandes }: { demandes: DemandeIntervenant[] }) {
  const parService = new Map<string, number>()
  demandes
    .filter((d) => d.statut !== "annulee")
    .forEach((d) => parService.set(d.service, (parService.get(d.service) ?? 0) + 1))
  const lignes = [...parService.entries()].sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...lignes.map((l) => l[1]))
  const rdv = demandes.filter((d) => d.statut === "acceptee" || d.statut === "en_cours")

  return (
    <>
      <CarteWidget icon={CalendarClock} titre="Prochains rendez-vous" sousTitre="Demandes acceptées à honorer" delai={200}>
        {rdv.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            Aucun rendez-vous pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rdv.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{d.service}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.demandeur_prenom} {d.demandeur_nom} · {ilYa(d.updated_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <BadgeStatut statut={d.statut} />
                  {d.demandeur_telephone && (
                    <a
                      href={`tel:${d.demandeur_telephone}`}
                      className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:scale-110"
                      aria-label="Appeler"
                    >
                      <Phone className="size-4" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CarteWidget>

      <CarteWidget icon={BarChart3} titre="Consultations par service" sousTitre="Depuis votre inscription" delai={300}>
        {lignes.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            Vos statistiques apparaîtront ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {lignes.map(([service, n], i) => (
              <li key={service}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{service}</span>
                  <span className="font-semibold tabular-nums">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full origin-left animate-in rounded-full bg-success duration-1000 zoom-in-0 fill-mode-both"
                    style={{ width: `${(n / max) * 100}%`, animationDelay: `${i * 120}ms` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CarteWidget>
    </>
  )
}
