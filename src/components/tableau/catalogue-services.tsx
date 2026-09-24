"use client"

import { ArrowRight } from "lucide-react"

import type { ServiceDisponible } from "@/components/tableau/formulaire-demande"
import { ESPACES_SERVICES } from "@/lib/espaces"

/** Les 4 espaces avec leurs services, visibles d'un coup d'œil. */
export function CatalogueServices({
  services,
  onChoisir,
}: {
  services: ServiceDisponible[]
  onChoisir: (espace: string, service: string) => void
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg font-bold">Les services</h2>
        <p className="text-sm text-muted-foreground">
          Cliquez sur un service : la demande se prépare toute seule.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ESPACES_SERVICES.map((e, i) => (
          <article
            key={e.slug}
            className="flex animate-in fade-in slide-in-from-bottom-4 flex-col rounded-2xl border bg-card p-5 shadow-sm duration-700 fill-mode-both"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <header className="mb-4 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <e.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-heading text-sm font-bold">{e.nom}</h3>
                <p className="text-xs text-muted-foreground">{e.intervenants}</p>
              </div>
            </header>
            <ul className="flex flex-col gap-1.5">
              {services
                .filter((s) => s.espace_slug === e.slug)
                .map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onChoisir(e.slug, s.id)}
                      className="group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {s.nom}
                      <ArrowRight className="size-4 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
