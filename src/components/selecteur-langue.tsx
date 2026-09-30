"use client"

import { useTransition } from "react"
import { Check, Languages, Loader2 } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { changerLangue } from "@/lib/i18n/actions"
import { LANGUES } from "@/lib/i18n/langues"
import { cn } from "@/lib/utils"

/** Bouton « langue » de l'en-tête : français, hébreu ou anglais. */
export function SelecteurLangue() {
  const langue = useLangue()
  const t = useT()
  const [enCours, lancer] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t.langue.changer} className="relative">
          {enCours ? <Loader2 className="animate-spin" /> : <Languages />}
          <span className="absolute -end-1 -bottom-1 rounded-full bg-primary px-1 text-[9px] leading-4 font-bold text-primary-foreground uppercase">
            {langue}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LANGUES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => l.code !== langue && lancer(() => changerLangue(l.code))}
            className="gap-3"
          >
            <span className="text-base leading-none">{l.drapeau}</span>
            <span className="flex-1">{l.nom}</span>
            {l.code === langue && <Check className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Les 3 langues côte à côte (page Paramètres). */
export function ChoixLangue() {
  const langue = useLangue()
  const [enCours, lancer] = useTransition()
  return (
    <div className="grid grid-cols-3 gap-2">
      {LANGUES.map((l) => (
        <button
          key={l.code}
          type="button"
          disabled={enCours}
          onClick={() => l.code !== langue && lancer(() => changerLangue(l.code))}
          aria-pressed={l.code === langue}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border-2 bg-card px-2 py-3 text-sm font-semibold transition-all active:scale-95",
            l.code === langue ? "border-primary text-primary shadow-md shadow-primary/15" : "border-border hover:border-primary/40"
          )}
        >
          <span className="text-xl leading-none">{l.drapeau}</span>
          {l.nom}
        </button>
      ))}
    </div>
  )
}
