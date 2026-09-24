import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Barre du haut des tableaux de bord : « Quitter » à gauche, actions à droite. */
export function BarreTableau({
  icon: Icon,
  espace,
  children,
}: {
  icon: LucideIcon
  espace: string
  children?: ReactNode
}) {
  return (
    <div className="flex animate-in fade-in slide-in-from-top-2 flex-wrap items-center justify-between gap-3 duration-500">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="group">
          <Link href="/">
            <ArrowLeft className="transition-transform group-hover:-translate-x-1" />
            Quitter
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
      </div>
    </div>
  )
}
