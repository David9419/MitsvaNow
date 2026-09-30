"use client"

import { useT } from "@/components/i18n/langue-provider"
import { STATUTS } from "@/lib/tableau/outils"
import type { StatutDemande } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

export function BadgeStatut({ statut, className }: { statut: StatutDemande; className?: string }) {
  const t = useT()
  const s = STATUTS[statut] ?? STATUTS.annulee
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        s.classe,
        className
      )}
    >
      <s.icon className="size-3.5" />
      {t.statuts[statut] ?? statut}
    </span>
  )
}
