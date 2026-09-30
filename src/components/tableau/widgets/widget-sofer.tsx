"use client"

import { BarChart3, CalendarClock, Phone } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import { BadgeStatut } from "@/components/tableau/badge-statut"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { formaterDateHeure, ilYa, nomService } from "@/lib/i18n"
import type { DemandeIntervenant } from "@/lib/tableau/types"

/** Sofer / Rav / Rabbanit : consultations par service + prochains rendez-vous. */
export function WidgetSofer({ demandes }: { demandes: DemandeIntervenant[] }) {
  const t = useT()
  const w = t.widgets
  const langue = useLangue()
  const parService = new Map<string, number>()
  demandes
    .filter((d) => ["acceptee", "en_cours", "terminee"].includes(d.statut))
    .forEach((d) => {
      const nom = nomService(d.service_noms, d.service, langue)
      parService.set(nom, (parService.get(nom) ?? 0) + 1)
    })
  const lignes = [...parService.entries()].sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...lignes.map((l) => l[1]))
  const rdv = demandes.filter((d) => d.statut === "acceptee" || d.statut === "en_cours")

  return (
    <>
      <CarteWidget icon={CalendarClock} titre={w.rdvTitre} sousTitre={w.rdvSous} delai={200}>
        {rdv.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            {w.rdvVide}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rdv.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{nomService(d.service_noms, d.service, langue)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.demandeur_prenom} {d.demandeur_nom} ·{" "}
                    {d.programmee_pour ? formaterDateHeure(d.programmee_pour, langue) : ilYa(d.updated_at, langue)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <BadgeStatut statut={d.statut} />
                  {d.demandeur_telephone && (
                    <a
                      href={`tel:${d.demandeur_telephone}`}
                      className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:scale-110"
                      aria-label={t.commun.appeler}
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

      <CarteWidget icon={BarChart3} titre={w.statsTitre} sousTitre={w.statsSous} delai={300}>
        {lignes.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            {w.statsVide}
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
                    className="h-full origin-left animate-in rounded-full bg-success duration-1000 zoom-in-0 fill-mode-both rtl:origin-right"
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
