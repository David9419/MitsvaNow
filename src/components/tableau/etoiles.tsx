"use client"

import { useState } from "react"
import { Star } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import { LOCALES } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/** 5 étoiles pour afficher une note (les demi-étoiles sont remplies en partie). */
export function Etoiles({ note, className }: { note: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => {
        const rempli = Math.max(0, Math.min(1, note - (n - 1)))
        return (
          <span key={n} className="relative inline-flex">
            <Star className="size-[1em] text-muted-foreground/30" />
            {rempli > 0 && (
              <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${rempli * 100}%` }}>
                <Star className="size-[1em] fill-accent text-accent" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/** « ★★★★☆ 4,6 (12 avis) » */
export function ResumeNote({
  moyenne,
  nombre,
  className,
  variante = "normal",
}: {
  moyenne: number | null
  nombre: number
  className?: string
  variante?: "normal" | "bandeau"
}) {
  const t = useT()
  const langue = useLangue()
  if (!nombre || moyenne == null)
    return <span className={cn("text-xs opacity-80", className)}>{t.avis.aucunAvis}</span>
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Etoiles note={Number(moyenne)} className={variante === "bandeau" ? "text-sm" : "text-base"} />
      <span className="font-bold tabular-nums">
        {Number(moyenne).toLocaleString(LOCALES[langue], { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </span>
      <span className={cn("tabular-nums", variante === "bandeau" ? "opacity-80" : "text-muted-foreground")}>
        ({t.avis.nombre(nombre)})
      </span>
    </span>
  )
}

/** Choix d'une note de 1 à 5 étoiles. */
export function ChoixNote({ note, onChoisir }: { note: number; onChoisir: (n: number) => void }) {
  const t = useT()
  const [survol, setSurvol] = useState(0)
  const actif = survol || note
  return (
    <div className="flex" onMouseLeave={() => setSurvol(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setSurvol(n)}
          onClick={() => onChoisir(n)}
          className="p-0.5 transition-transform hover:scale-125 active:scale-95"
          aria-label={t.avis.etoiles(n)}
          aria-pressed={note === n}
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              n <= actif ? "fill-accent text-accent" : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  )
}
