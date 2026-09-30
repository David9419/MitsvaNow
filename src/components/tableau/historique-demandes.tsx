"use client"

import { useState } from "react"
import { Loader2, Quote, Send } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import { BadgeStatut } from "@/components/tableau/badge-statut"
import { ChoixNote, Etoiles } from "@/components/tableau/etoiles"
import { Button } from "@/components/ui/button"
import { ilYa, nomService } from "@/lib/i18n"
import { trouverEspace } from "@/lib/espaces"
import type { DemandeDemandeur } from "@/lib/tableau/types"

/** Laisser un avis : les étoiles, puis un petit mot (facultatif). */
function FormulaireAvis({ onEnvoyer }: { onEnvoyer: (note: number, commentaire: string) => Promise<void> }) {
  const t = useT()
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState("")
  const [envoi, setEnvoi] = useState(false)
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl bg-accent/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold">{t.avis.noter}</span>
        <ChoixNote note={note} onChoisir={setNote} />
      </div>
      {note > 0 && (
        <div className="flex animate-in fade-in slide-in-from-top-1 flex-col gap-2 duration-300">
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={t.avis.commentairePh}
            aria-label={t.avis.commentaire}
            className="w-full resize-none rounded-lg border bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <Button
            size="sm"
            disabled={envoi}
            onClick={async () => {
              setEnvoi(true)
              await onEnvoyer(note, commentaire.trim())
              setEnvoi(false)
            }}
            className="self-end"
          >
            {envoi ? <Loader2 className="animate-spin" /> : <Send className="rtl:-scale-x-100" />} {t.avis.envoyer}
          </Button>
        </div>
      )}
    </div>
  )
}

/** Les demandes terminées, avec la note donnée (ou à donner). */
export function HistoriqueDemandes({
  demandes,
  onNoter,
}: {
  demandes: DemandeDemandeur[]
  onNoter: (id: string, note: number, commentaire: string) => Promise<void>
}) {
  const t = useT()
  const langue = useLangue()
  if (demandes.length === 0) {
    return <p className="rounded-xl bg-muted/60 p-6 text-center text-sm text-muted-foreground">{t.demandeur.historiqueVide}</p>
  }
  return (
    <ul className="flex flex-col gap-3">
      {demandes.map((d, i) => {
        const espace = trouverEspace(d.espace_slug)
        return (
          <li
            key={d.id}
            className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border p-3 fill-mode-both"
            style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold">{nomService(d.service_noms, d.service, langue)}</p>
                <p className="text-xs text-muted-foreground">
                  {espace ? t.espaces[espace.slug].nom : d.espace_nom} · {ilYa(d.created_at, langue)}
                  {d.intervenant_prenom && ` · ${t.demandeur.avec(d.intervenant_prenom)}`}
                </p>
              </div>
              {d.note ? <Etoiles note={d.note} className="text-base" /> : <BadgeStatut statut={d.statut} />}
            </div>
            {d.note && d.commentaire && (
              <p className="mt-2 flex gap-2 rounded-lg bg-muted/60 p-2 text-xs">
                <Quote className="size-3 shrink-0 text-muted-foreground rtl:-scale-x-100" /> {d.commentaire}
              </p>
            )}
            {d.statut === "terminee" && !d.note && (
              <FormulaireAvis onEnvoyer={(note, commentaire) => onNoter(d.id, note, commentaire)} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
