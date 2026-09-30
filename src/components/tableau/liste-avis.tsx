"use client"

import { Quote } from "lucide-react"

import { Avatar } from "@/components/avatar"
import { useLangue } from "@/components/i18n/langue-provider"
import { Etoiles } from "@/components/tableau/etoiles"
import { ilYa, nomService } from "@/lib/i18n"
import type { NomsService } from "@/lib/tableau/types"

export type AvisAffiche = {
  cle: string
  nom: string
  photo?: string | null
  note: number
  commentaire: string | null
  created_at: string
  service?: string
  service_noms?: NomsService | null
}

/** Liste d'avis : qui, combien d'étoiles, quand, et le petit mot. */
export function ListeAvis({ avis }: { avis: AvisAffiche[] }) {
  const langue = useLangue()
  return (
    <ul className="flex flex-col gap-2.5">
      {avis.map((a, i) => (
        <li
          key={a.cle}
          className="animate-in fade-in slide-in-from-bottom-1 rounded-xl border bg-card p-3 fill-mode-both"
          style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
        >
          <div className="flex items-center gap-3">
            <Avatar src={a.photo} nom={a.nom} className="size-9 text-sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{a.nom}</p>
                <span className="shrink-0 text-[11px] text-muted-foreground">{ilYa(a.created_at, langue)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Etoiles note={a.note} className="text-sm" />
                {a.service && <span className="truncate">{nomService(a.service_noms, a.service, langue)}</span>}
              </div>
            </div>
          </div>
          {a.commentaire && (
            <p className="mt-2 flex gap-2 rounded-lg bg-muted/60 p-2.5 text-sm">
              <Quote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground rtl:-scale-x-100" />
              {a.commentaire}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
