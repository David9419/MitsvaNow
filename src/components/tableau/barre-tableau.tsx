"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft, Settings, type LucideIcon } from "lucide-react"

import { useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"

/** Barre du haut des tableaux de bord : « Quitter » à gauche, actions et paramètres à droite. */
export function BarreTableau({
  icon: Icon,
  espace,
  children,
  retour = "/",
  libelleRetour,
  parametres = true,
}: {
  icon: LucideIcon
  espace: string
  children?: ReactNode
  /** Où mène le bouton de gauche */
  retour?: string
  libelleRetour?: string
  /** Afficher le bouton ⚙️ Paramètres */
  parametres?: boolean
}) {
  const t = useT()
  return (
    <div className="flex animate-in fade-in slide-in-from-top-2 flex-wrap items-center justify-between gap-3 duration-500">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="group">
          <Link href={retour}>
            <ArrowLeft className="transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
            {libelleRetour ?? t.commun.quitter}
          </Link>
        </Button>
        <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <span className="text-border">/</span>
          <Icon className="size-4 text-primary" />
          <span className="font-medium text-foreground">{espace}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {parametres && (
          <Button asChild size="icon" variant="outline" className="group rounded-full" title={t.commun.parametres}>
            <Link href="/accueil/parametres" aria-label={t.commun.parametres}>
              <Settings className="transition-transform duration-500 group-hover:rotate-90" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
