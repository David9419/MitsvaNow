import { STATUTS } from "@/lib/tableau/outils"
import type { StatutDemande } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

export function BadgeStatut({ statut, className }: { statut: StatutDemande; className?: string }) {
  const s = STATUTS[statut]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        s.classe,
        className
      )}
    >
      <s.icon className="size-3.5" />
      {s.label}
    </span>
  )
}
