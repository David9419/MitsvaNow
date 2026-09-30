"use client"

import { useState } from "react"
import { ChevronDown, MessageSquareHeart } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import { Etoiles } from "@/components/tableau/etoiles"
import { ListeAvis } from "@/components/tableau/liste-avis"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { LOCALES } from "@/lib/i18n"
import type { ResumeAvis } from "@/lib/tableau/types"

const VISIBLES = 3

/** Les avis reçus : moyenne sur 5, nombre d'avis, et la liste avec le nom des personnes. */
export function CarteAvis({ avis, className }: { avis: ResumeAvis; className?: string }) {
  const t = useT()
  const langue = useLangue()
  const [tout, setTout] = useState(false)
  const moyenne = avis.moyenne == null ? null : Number(avis.moyenne)
  // Répartition des notes (5 → 1)
  const repartition = [5, 4, 3, 2, 1].map((n) => ({ n, nb: avis.liste.filter((a) => a.note === n).length }))
  const liste = tout ? avis.liste : avis.liste.slice(0, VISIBLES)

  return (
    <CarteWidget icon={MessageSquareHeart} titre={t.avis.titre} sousTitre={t.avis.sousTitre} delai={400} className={className}>
      {avis.nombre === 0 || moyenne == null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-muted/60 p-5 text-center">
          <Etoiles note={0} className="text-2xl" />
          <p className="text-sm text-muted-foreground">{t.avis.aucun}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-5 rounded-xl bg-accent/10 p-4">
            <div className="text-center">
              <p className="font-heading text-4xl font-bold tabular-nums">
                {moyenne.toLocaleString(LOCALES[langue], { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </p>
              <p className="text-xs text-muted-foreground">{t.avis.surCinq}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Etoiles note={moyenne} className="text-lg" />
                <span className="text-sm font-semibold text-muted-foreground">{t.avis.nombre(avis.nombre)}</span>
              </div>
              {repartition.map((r) => (
                <div key={r.n} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="w-2 tabular-nums">{r.n}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-1000"
                      style={{ width: `${(r.nb / avis.nombre) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-end tabular-nums">{r.nb}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <ListeAvis
              avis={liste.map((a) => ({
                cle: a.id,
                nom: `${a.prenom} ${a.nom ?? ""}`.trim(),
                photo: a.photo,
                note: a.note,
                commentaire: a.commentaire,
                created_at: a.created_at,
                service: a.service,
                service_noms: a.service_noms,
              }))}
            />
          </div>
          {avis.liste.length > VISIBLES && (
            <button
              type="button"
              onClick={() => setTout((v) => !v)}
              className="mt-3 flex items-center justify-center gap-1 self-center rounded-full px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              {tout ? t.avis.voirMoins : t.avis.voirTout(avis.liste.length)}
              <ChevronDown className={`size-4 transition-transform ${tout ? "rotate-180" : ""}`} />
            </button>
          )}
        </>
      )}
    </CarteWidget>
  )
}
