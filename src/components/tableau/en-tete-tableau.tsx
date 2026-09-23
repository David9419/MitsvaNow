import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Grand bandeau d'accueil du tableau de bord, aux couleurs de l'espace. */
export function EnTeteTableau({
  icon: Icon,
  theme,
  surtitre,
  titre,
  texte,
  badges,
  droite,
}: {
  icon: LucideIcon
  theme: string
  surtitre: string
  titre: string
  texte: string
  badges?: ReactNode
  droite?: ReactNode
}) {
  return (
    <section
      className={cn(
        "relative animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-3xl p-6 shadow-xl duration-700 sm:p-8",
        theme
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-20 size-72 animate-blob rounded-full bg-current opacity-10 blur-3xl" />
        <div
          className="absolute -bottom-24 left-1/3 size-72 animate-blob rounded-full bg-current opacity-10 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
        <Icon className="absolute -right-6 -bottom-8 size-56 rotate-12 opacity-10" />
      </div>
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 animate-float items-center justify-center rounded-2xl bg-current/15 shadow-lg ring-1 ring-current/20">
            <Icon className="size-7" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide uppercase opacity-80">{surtitre}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{titre}</h1>
            <p className="mt-2 max-w-xl opacity-85">{texte}</p>
            {badges && <div className="mt-4 flex flex-wrap gap-2">{badges}</div>}
          </div>
        </div>
        {droite}
      </div>
    </section>
  )
}

/** Petite pastille d'information dans le bandeau. */
export function PastilleEnTete({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-current/10 px-3 py-1 text-xs font-semibold ring-1 ring-current/20">
      {children}
    </span>
  )
}
