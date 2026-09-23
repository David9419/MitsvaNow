"use client"

import { useState } from "react"
import { Star } from "lucide-react"

import { BadgeStatut } from "@/components/tableau/badge-statut"
import { ilYa } from "@/lib/tableau/outils"
import type { DemandeDemandeur } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

/** Étoiles pour noter une intervention terminée. */
function Etoiles({ note, onNoter }: { note: number | null; onNoter?: (n: number) => void }) {
  const [survol, setSurvol] = useState(0)
  const actif = survol || note || 0
  return (
    <div className="flex" onMouseLeave={() => setSurvol(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onNoter}
          onMouseEnter={() => onNoter && setSurvol(n)}
          onClick={() => onNoter?.(n)}
          className="p-0.5 transition-transform enabled:hover:scale-125 disabled:cursor-default"
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              n <= actif ? "fill-accent text-accent" : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function HistoriqueDemandes({
  demandes,
  onNoter,
}: {
  demandes: DemandeDemandeur[]
  onNoter: (id: string, note: number) => void
}) {
  if (demandes.length === 0) {
    return (
      <p className="rounded-xl bg-muted/60 p-6 text-center text-sm text-muted-foreground">
        Votre historique apparaîtra ici.
      </p>
    )
  }
  return (
    <ul className="flex flex-col gap-3">
      {demandes.map((d, i) => (
        <li
          key={d.id}
          className="flex animate-in fade-in slide-in-from-bottom-2 flex-wrap items-center justify-between gap-3 rounded-xl border p-3 fill-mode-both"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div>
            <p className="font-semibold">{d.service}</p>
            <p className="text-xs text-muted-foreground">
              {d.espace_nom} · {ilYa(d.created_at)}
              {d.intervenant_prenom && ` · avec ${d.intervenant_prenom}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {d.statut === "terminee" && (
              <div className="flex flex-col items-end">
                <Etoiles note={d.note} onNoter={d.note ? undefined : (n) => onNoter(d.id, n)} />
                {!d.note && <span className="text-[11px] text-muted-foreground">Notez l&apos;intervention</span>}
              </div>
            )}
            <BadgeStatut statut={d.statut} />
          </div>
        </li>
      ))}
    </ul>
  )
}
