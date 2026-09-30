"use client"

import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

import { useT } from "@/components/i18n/langue-provider"
import { cn } from "@/lib/utils"

/** Fenêtre au centre de l'écran (en bas sur téléphone), fond flouté. */
export function Fenetre({
  ouverte,
  onFermer,
  titre,
  children,
  className,
}: {
  ouverte: boolean
  onFermer: () => void
  titre: string
  children: ReactNode
  className?: string
}) {
  const t = useT()
  // Échap ferme la fenêtre
  useEffect(() => {
    if (!ouverte) return
    const touche = (e: KeyboardEvent) => e.key === "Escape" && onFermer()
    window.addEventListener("keydown", touche)
    return () => window.removeEventListener("keydown", touche)
  }, [ouverte, onFermer])

  if (!ouverte) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-in fade-in bg-background/60 backdrop-blur-md duration-300" onClick={onFermer} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className={cn(
          "entree-flou relative max-h-[92svh] w-full max-w-md overflow-y-auto rounded-3xl border bg-popover p-6 text-popover-foreground shadow-2xl",
          className
        )}
      >
        <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-48 animate-blob rounded-full bg-primary/15 blur-3xl" />
        <button
          type="button"
          onClick={onFermer}
          aria-label={t.commun.fermer}
          className="absolute end-3 top-3 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <div className="relative">{children}</div>
      </div>
    </div>
  )
}
