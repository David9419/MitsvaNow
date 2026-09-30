"use client"

import { useState } from "react"
import { BellOff, BellRing, CheckCircle2, Send, Share, SquarePlus } from "lucide-react"

import { useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"
import type { EtatPush } from "@/lib/tableau/push"
import { cn } from "@/lib/utils"

/** Les 3 étapes pour installer l'application sur iPhone / iPad. */
export function EtapesEcranAccueil() {
  const t = useT()
  const n = t.notifications
  const etape = "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
  return (
    <ol className="flex flex-col gap-2 text-sm">
      <li className="flex items-center gap-2">
        <span className={etape}>1</span>
        <span>
          {n.etape1Avant} <Share className="inline size-4 text-primary" aria-label={n.partager} /> {n.etape1Apres}
        </span>
      </li>
      <li className="flex items-center gap-2">
        <span className={etape}>2</span>
        <span>
          {n.etape2Avant} <SquarePlus className="inline size-4 text-primary" /> {n.etape2Apres}
        </span>
      </li>
      <li className="flex items-center gap-2">
        <span className={etape}>3</span>
        <span>{n.etape3}</span>
      </li>
    </ol>
  )
}

/**
 * Bandeau « Notifications » affiché en haut de chaque espace :
 * bouton pour les activer, puis bouton pour envoyer une notification de test.
 */
export function BandeauNotifications({
  etat,
  onActiver,
  onTester,
  texte,
}: {
  etat: EtatPush
  onActiver: () => void
  onTester: () => void
  /** Ce qu'on reçoit dans cet espace */
  texte: string
}) {
  const t = useT()
  const n = t.notifications
  const [etapes, setEtapes] = useState(false)
  if (etat === "chargement") return null

  // Déjà activées : ligne discrète + bouton de test
  if (etat === "actif")
    return (
      <section className="flex animate-in fade-in flex-col gap-3 rounded-2xl border border-success/40 bg-success/5 px-5 py-3 duration-500 sm:flex-row sm:items-center">
        <CheckCircle2 className="hidden size-5 shrink-0 text-success sm:block" />
        <p className="flex-1 text-sm">
          <span className="font-semibold">{n.actives}</span> <span className="text-muted-foreground">{texte}</span>
        </p>
        <Button variant="outline" size="sm" onClick={onTester} className="shrink-0">
          <Send className="rtl:-scale-x-100" /> {n.tester}
        </Button>
      </section>
    )

  return (
    <section className="flex animate-in fade-in slide-in-from-top-2 flex-col gap-4 rounded-2xl border border-accent/50 bg-accent/10 p-5 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {etat === "refuse" ? <BellOff className="size-6" /> : <BellRing className="size-6 animate-pulse" />}
        </span>
        <div className="flex-1">
          <h2 className="font-heading font-bold">{etat === "refuse" ? n.bloqueesTitre : n.activerTitre}</h2>
          <p className="text-sm text-muted-foreground">
            {etat === "refuse" ? n.refuse : etat === "non-supporte" ? n.nonSupporte : `${texte} ${n.recevoir}`}
          </p>
        </div>
        {etat !== "non-supporte" && (
          <Button
            onClick={() => (etat === "ecran-accueil" ? setEtapes(true) : onActiver())}
            size="lg"
            className={cn("shrink-0", etapes && "hidden")}
          >
            <BellRing /> {etat === "refuse" ? n.reessayer : n.activer}
          </Button>
        )}
      </div>
      {etat === "ecran-accueil" && etapes && (
        <div className="animate-in fade-in rounded-xl border bg-card p-4 duration-300">
          <p className="mb-3 text-sm font-semibold">{n.iphone}</p>
          <EtapesEcranAccueil />
        </div>
      )}
    </section>
  )
}
