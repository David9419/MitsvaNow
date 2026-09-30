"use client"

import { useEffect, useState } from "react"
import { Check, RotateCcw } from "lucide-react"

import { useT } from "@/components/i18n/langue-provider"
import { cn } from "@/lib/utils"

/** Petite liste à cocher, mémorisée dans le navigateur. */
export function Checklist({ cle, elements }: { cle: string; elements: string[] }) {
  const t = useT()
  const [coches, setCoches] = useState<number[]>([])

  useEffect(() => {
    try {
      const v = localStorage.getItem(cle)
      // Les cases cochées sont retenues par leur numéro (la même liste, quelle que soit la langue)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local
      if (v) setCoches((JSON.parse(v) as unknown[]).filter((x): x is number => typeof x === "number"))
    } catch {}
  }, [cle])

  const basculer = (i: number) => {
    const suivant = coches.includes(i) ? coches.filter((x) => x !== i) : [...coches, i]
    setCoches(suivant)
    try {
      localStorage.setItem(cle, JSON.stringify(suivant))
    } catch {}
  }

  const fait = coches.length
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t.widgets.prets(fait, elements.length)}</span>
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
            <RotateCcw className="size-3" /> {t.widgets.toutDecocher}
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
        {elements.map((e, i) => {
          const ok = coches.includes(i)
          return (
            <li key={e}>
              <button
                type="button"
                onClick={() => basculer(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start text-sm transition-all hover:bg-muted active:scale-[0.98]",
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
