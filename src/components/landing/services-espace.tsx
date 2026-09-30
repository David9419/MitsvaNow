"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { useT } from "@/components/i18n/langue-provider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/** Les services d'un espace ; « Voir plus » affiche les services ajoutés. */
export function ServicesEspace({ exemples, plus }: { exemples: string[]; plus: string[] }) {
  const t = useT()
  const [ouvert, setOuvert] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {exemples.map((x) => (
          <Badge key={x} variant="secondary">
            {x}
          </Badge>
        ))}
        {plus.length > 0 && (
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            aria-expanded={ouvert}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            {ouvert ? t.commun.voirMoins : `${t.commun.voirPlus} (+${plus.length})`}
            <ChevronDown className={cn("size-3.5 transition-transform duration-300", ouvert && "rotate-180")} />
          </button>
        )}
      </div>
      {plus.length > 0 && (
        <div
          className={cn(
            "grid transition-all duration-500 ease-out",
            ouvert ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-wrap gap-2 pt-1">
              {plus.map((x, i) => (
                <Badge
                  key={x}
                  variant="outline"
                  className={cn("border-primary/30 bg-card", ouvert && "animate-in fade-in zoom-in-95 fill-mode-both")}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {x}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
