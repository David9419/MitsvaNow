import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

/** Cadre commun des cartes du tableau de bord. */
export function CarteWidget({
  icon: Icon,
  titre,
  sousTitre,
  action,
  children,
  delai = 0,
}: {
  icon: LucideIcon
  titre: string
  sousTitre?: string
  action?: ReactNode
  children: ReactNode
  delai?: number
}) {
  return (
    <section
      className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border bg-card p-5 shadow-sm duration-700 fill-mode-both"
      style={{ animationDelay: `${delai}ms` }}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" />
          </span>
          <div>
            <h2 className="font-heading text-sm font-bold">{titre}</h2>
            {sousTitre && <p className="text-xs text-muted-foreground">{sousTitre}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
