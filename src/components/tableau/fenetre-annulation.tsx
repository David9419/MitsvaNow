"use client"

import { useState } from "react"
import { Loader2, X } from "lucide-react"

import { useT } from "@/components/i18n/langue-provider"
import { Fenetre } from "@/components/tableau/fenetre"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Annuler une demande : on choisit (ou on écrit) un motif, l'autre personne est prévenue. */
export function FenetreAnnulation({
  ouverte,
  cote,
  service,
  onFermer,
  onValider,
}: {
  ouverte: boolean
  /** Qui annule */
  cote: "demandeur" | "intervenant"
  service: string
  onFermer: () => void
  onValider: (motif: string) => Promise<boolean>
}) {
  const t = useT()
  const a = t.annulation
  const motifs = cote === "intervenant" ? a.motifsIntervenant : a.motifsDemandeur
  const [choix, setChoix] = useState<string | null>(null)
  const [texte, setTexte] = useState("")
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(false)

  const fermer = () => {
    setChoix(null)
    setTexte("")
    setErreur(false)
    onFermer()
  }

  const valider = async () => {
    const motif = [choix, texte.trim()].filter(Boolean).join(" — ")
    if (!motif) return setErreur(true)
    setEnvoi(true)
    const ok = await onValider(motif)
    setEnvoi(false)
    if (ok) fermer()
  }

  return (
    <Fenetre ouverte={ouverte} onFermer={fermer} titre={a.titre}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <X className="size-6" />
      </div>
      <h2 className="pe-8 text-xl font-bold">{a.titre}</h2>
      <p className="mt-1 text-sm font-medium text-primary">{service}</p>
      <p className="mt-2 text-sm text-muted-foreground">{cote === "intervenant" ? a.texteIntervenant : a.texteDemandeur}</p>

      <p className="mt-5 mb-2 text-sm font-semibold">{a.motif}</p>
      <div className="flex flex-wrap gap-2">
        {motifs.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setChoix(choix === m ? null : m)
              setErreur(false)
            }}
            aria-pressed={choix === m}
            className={cn(
              "rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95",
              choix === m ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card hover:border-primary/40"
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <textarea
        value={texte}
        onChange={(e) => {
          setTexte(e.target.value)
          setErreur(false)
        }}
        maxLength={250}
        rows={3}
        placeholder={choix ? a.placeholder : `${a.autre}… ${a.placeholder}`}
        aria-label={a.autre}
        className={cn(
          "mt-3 w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          erreur && "border-destructive"
        )}
      />
      {erreur && <p className="mt-2 animate-secoue text-sm font-medium text-destructive">{a.motifRequis}</p>}

      <div className="mt-5 flex flex-col gap-2">
        <Button size="lg" variant="destructive" onClick={valider} disabled={envoi} className="h-12 text-base">
          {envoi ? <Loader2 className="animate-spin" /> : <X />}
          {a.confirmer}
        </Button>
        <Button variant="ghost" onClick={fermer} disabled={envoi}>
          {a.garder}
        </Button>
      </div>
    </Fenetre>
  )
}
