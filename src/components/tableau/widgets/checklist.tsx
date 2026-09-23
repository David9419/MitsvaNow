"use client"

import { useEffect, useState } from "react"
import { Check, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"

/** Petite liste à cocher, mémorisée dans le navigateur. */
export function Checklist({ cle, elements }: { cle: string; elements: string[] }) {
  const [coches, setCoches] = useState<string[]>([])

  useEffect(() => {
    try {
      const v = localStorage.getItem(cle)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local
      if (v) setCoches(JSON.parse(v))
    } catch {}
  }, [cle])

  const basculer = (e: string) => {
    const suivant = coches.includes(e) ? coches.filter((x) => x !== e) : [...coches, e]
    setCoches(suivant)
    try {
      localStorage.setItem(cle, JSON.stringify(suivant))
    } catch {}
  }

  const fait = coches.length
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {fait}/{elements.length} prêt{fait > 1 ? "s" : ""}
        </span>
        {fait > 0 && (
          <button
            type="button"
            onClick={() => {
              setCoches([])
              try {
                localStorage.removeItem(cle)
              } catch {}
            }}
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Tout décocher
          </button>
        )}
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-success transition-all duration-700 ease-out"
          style={{ width: `${(fait / elements.length) * 100}%` }}
        />
      </div>
      <ul className="flex flex-col gap-1.5">
        {elements.map((e) => {
          const ok = coches.includes(e)
          return (
            <li key={e}>
              <button
                type="button"
                onClick={() => basculer(e)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-all hover:bg-muted active:scale-[0.98]",
                  ok && "text-muted-foreground line-through"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-300",
                    ok ? "scale-110 border-success bg-success text-success-foreground" : "border-border"
                  )}
                >
                  {ok && <Check className="size-3.5 animate-in zoom-in" />}
                </span>
                {e}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
