import type { LucideIcon } from "lucide-react"

import { CompteurAnime } from "@/components/tableau/compteur-anime"
import { cn } from "@/lib/utils"

export function CarteStat({
  icon: Icon,
  label,
  valeur,
  detail,
  accent = "primary",
  delai = 0,
}: {
  icon: LucideIcon
  label: string
  valeur: number
  detail?: string
  accent?: "primary" | "accent" | "success" | "muted"
  delai?: number
}) {
  const couleurs = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/20 text-accent-foreground dark:text-accent",
    success: "bg-success/15 text-success",
    muted: "bg-muted text-muted-foreground",
  }
  return (
    <div
      className="group animate-in fade-in slide-in-from-bottom-4 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-500 fill-mode-both hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${delai}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
            couleurs[accent]
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-2 font-heading text-3xl font-bold tabular-nums">
        <CompteurAnime valeur={valeur} />
      </p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  )
}
