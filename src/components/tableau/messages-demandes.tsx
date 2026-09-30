"use client"

import { useEffect, useState } from "react"
import { BellRing, RotateCcw, TimerOff, X } from "lucide-react"

import { useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"
import { useMaintenant } from "@/hooks/use-maintenant"

const CLE = "mn-messages-vus"
/** Les messages restent affichés 7 jours au plus. */
const DUREE_MS = 7 * 24 * 3600 * 1000

export type MessageDemande = {
  id: string
  date: string
  titre: string
  texte?: string | null
  motif?: string | null
  ton: "annulee" | "expiree"
  refaire?: () => void
}

function lireVus(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? "[]")
  } catch {
    return []
  }
}

/**
 * Messages importants sur les demandes (annulée avec son motif, expirée) :
 * visibles même si l'on n'était pas sur le site au moment où c'est arrivé,
 * jusqu'à ce qu'on touche « J'ai compris ».
 */
export function MessagesDemandes({ messages }: { messages: MessageDemande[] }) {
  const t = useT()
  const maintenant = useMaintenant(60000)
  const [vus, setVus] = useState<string[] | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local
    setVus(lireVus())
  }, [])

  if (!vus) return null
  const recents = messages.filter((m) => !vus.includes(m.id) && maintenant - new Date(m.date).getTime() < DUREE_MS)
  if (recents.length === 0) return null

  const marquer = (id: string) => {
    const suivant = [...vus, id].slice(-100)
    setVus(suivant)
    try {
      localStorage.setItem(CLE, JSON.stringify(suivant))
    } catch {}
  }

  return (
    <section className="flex animate-in fade-in slide-in-from-top-2 flex-col gap-3 duration-500">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
        <BellRing className="size-5 text-destructive" /> {t.messages.titre}
      </h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {recents.map((m) => (
          <article
            key={m.id}
            className="flex animate-in fade-in zoom-in-95 gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 duration-300"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              {m.ton === "expiree" ? <TimerOff className="size-5" /> : <X className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m.titre}</p>
              {m.texte && <p className="mt-0.5 text-sm text-muted-foreground">{m.texte}</p>}
              {m.motif && (
                <p className="mt-2 rounded-lg bg-card px-3 py-2 text-sm">
                  <span className="font-semibold">{t.tableau.motif} : </span>
                  {m.motif}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {m.refaire && (
                  <Button
                    size="sm"
                    onClick={() => {
                      marquer(m.id)
                      m.refaire?.()
                    }}
                  >
                    <RotateCcw /> {t.messages.refaire}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => marquer(m.id)}>
                  {t.messages.compris}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
