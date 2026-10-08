"use client"

import { useEffect, useState, useTransition } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { changerLangue } from "@/lib/i18n/actions"
import { direction, LANGUES, type Langue } from "@/lib/i18n/langues"
import { cn } from "@/lib/utils"

/**
 * Change la langue du site avec une animation : un voile flou recouvre la page,
 * le drapeau apparaît avec « Bienvenue » dans la nouvelle langue, puis tout s'efface.
 */
function useChangementLangue() {
  const langue = useLangue()
  const [enCours, lancer] = useTransition()
  const [cible, setCible] = useState<Langue | null>(null)
  const [sortie, setSortie] = useState(false)

  const choisir = (code: Langue) => {
    if (code === langue || enCours) return
    setSortie(false)
    setCible(code)
    lancer(() => changerLangue(code))
  }

  // La nouvelle langue est arrivée : on laisse le voile un instant, puis il s'efface
  useEffect(() => {
    if (enCours || !cible) return
    const a = setTimeout(() => setSortie(true), 350)
    const b = setTimeout(() => {
      setCible(null)
      setSortie(false)
    }, 900)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [enCours, cible])

  const l = LANGUES.find((x) => x.code === cible)
  const voile =
    l &&
    createPortal(
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background/75 backdrop-blur-xl duration-500",
          sortie ? "animate-out fade-out fill-mode-forwards" : "animate-in fade-in"
        )}
      >
        <span className="relative flex size-28 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 animate-anneau-langue rounded-full bg-[conic-gradient(from_0deg,var(--primary),transparent_70%)] opacity-80"
          />
          <span className="absolute inset-1.5 rounded-full bg-background" />
          <span className="relative animate-in zoom-in-50 text-6xl leading-none duration-500">{l.drapeau}</span>
        </span>
        <p
          lang={l.code}
          dir={direction(l.code)}
          className="animate-mot-langue font-heading text-3xl font-bold tracking-tight [animation-delay:150ms]"
        >
          {l.bienvenue}
        </p>
        <p
          lang={l.code}
          className={cn(
            "animate-mot-langue text-sm font-semibold text-muted-foreground uppercase [animation-delay:300ms]",
            l.code !== "he" && "tracking-[0.3em]"
          )}
        >
          {l.nom}
        </p>
      </div>,
      document.body
    )

  return { langue, choisir, enCours, voile }
}

/** Bouton « langue » de l'en-tête : drapeau + code, et un joli menu des 3 langues. */
export function SelecteurLangue() {
  const t = useT()
  const { langue, choisir, voile } = useChangementLangue()
  const actuelle = LANGUES.find((l) => l.code === langue) ?? LANGUES[0]

  return (
    <>
      {voile}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t.langue.changer}
            title={t.langue.changer}
            className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-background ps-1.5 pe-2 text-xs font-bold shadow-xs transition-all outline-none hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-primary/50 data-[state=open]:bg-primary/5 dark:bg-input/30"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-sm leading-none transition-transform duration-300 group-hover:scale-110">
              {actuelle.drapeau}
            </span>
            <span className="uppercase">{actuelle.code}</span>
            <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-2xl p-1.5">
          {LANGUES.map((l) => {
            const choisie = l.code === langue
            return (
              <DropdownMenuItem
                key={l.code}
                onClick={() => choisir(l.code)}
                className={cn("gap-3 rounded-xl px-2.5 py-2", choisie && "bg-primary/10 focus:bg-primary/15")}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-lg leading-none">
                  {l.drapeau}
                </span>
                <span className="flex flex-1 flex-col">
                  <span lang={l.code} className={cn("font-semibold", choisie && "text-primary")}>
                    {l.nom}
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{l.code}</span>
                </span>
                {choisie && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

/** Les 3 langues côte à côte (page Paramètres). */
export function ChoixLangue() {
  const { langue, choisir, enCours, voile } = useChangementLangue()
  return (
    <div className="grid grid-cols-3 gap-2">
      {voile}
      {LANGUES.map((l) => (
        <button
          key={l.code}
          type="button"
          disabled={enCours}
          onClick={() => choisir(l.code)}
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
