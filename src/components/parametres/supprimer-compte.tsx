"use client"

import { useActionState, useState } from "react"
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react"

import { supprimerMonCompte } from "@/app/(auth)/actions"
import { ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { useT } from "@/components/i18n/langue-provider"
import { Fenetre } from "@/components/tableau/fenetre"
import { Button } from "@/components/ui/button"

/** Carte « Supprimer mon compte » des Paramètres, avec une fenêtre de confirmation. */
export function SupprimerCompte({ estAdmin }: { estAdmin: boolean }) {
  const t = useT()
  const s = t.parametres.suppression
  const [ouverte, setOuverte] = useState(false)
  const [etat, action, enCours] = useActionState(supprimerMonCompte, undefined)

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-destructive/30 bg-card p-5 shadow-sm duration-700 fill-mode-both">
      <header className="mb-3 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <Trash2 className="size-4.5" />
        </span>
        <div>
          <h2 className="font-heading text-sm font-bold">{s.titre}</h2>
          <p className="text-xs text-muted-foreground">{s.sousTitre}</p>
        </div>
      </header>
      <p className="text-sm text-muted-foreground">{estAdmin ? s.admin : s.texte}</p>
      {!estAdmin && (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setOuverte(true)}
        >
          <Trash2 /> {s.bouton}
        </Button>
      )}

      <Fenetre ouverte={ouverte} onFermer={() => !enCours && setOuverte(false)} titre={s.fenetreTitre}>
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="pe-8 text-xl font-bold">{s.fenetreTitre}</h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
          {s.consequences.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <X className="mt-0.5 size-4 shrink-0 text-destructive" /> {c}
            </li>
          ))}
        </ul>
        <form action={action} className="mt-5 flex flex-col gap-4">
          <ChampMotDePasse label={s.motDePasse} autoComplete="current-password" />
          <MessageErreur message={etat?.erreur} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOuverte(false)} disabled={enCours}>
              {s.annuler}
            </Button>
            <Button type="submit" variant="destructive" disabled={enCours}>
              {enCours ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {enCours ? s.enCours : s.confirmer}
            </Button>
          </div>
        </form>
      </Fenetre>
    </section>
  )
}
