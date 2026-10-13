"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Ban, Flag, Loader2, Phone } from "lucide-react"

import { useT } from "@/components/i18n/langue-provider"
import { MessageErreur } from "@/components/auth/champ"
import { Fenetre } from "@/components/tableau/fenetre"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { messageErreur } from "@/lib/tableau/outils"
import { cn } from "@/lib/utils"

const MOTIFS = ["comportement", "harcelement", "faux_profil", "absence", "danger", "autre"] as const
type Motif = (typeof MOTIFS)[number]

/**
 * Petit bouton « Signaler » + fenêtre pour signaler et/ou bloquer la personne
 * liée à une demande (le demandeur ou l'intervenant, selon qui clique).
 */
export function BoutonSignaler({
  demandeId,
  nom,
  onFait,
  className,
}: {
  demandeId: string
  /** Prénom de la personne signalée */
  nom: string
  /** Appelé après un blocage (pour recharger la liste) */
  onFait?: () => void
  className?: string
}) {
  const t = useT()
  const s = t.signalement
  const supabase = useRef(createClient()).current
  const [ouverte, setOuverte] = useState(false)
  const [motif, setMotif] = useState<Motif | null>(null)
  const [details, setDetails] = useState("")
  const [bloquer, setBloquer] = useState(true)
  const [erreur, setErreur] = useState<string>()
  const [enCours, setEnCours] = useState<"signaler" | "bloquer" | null>(null)

  const fermer = () => {
    if (enCours) return
    setOuverte(false)
    setMotif(null)
    setDetails("")
    setBloquer(true)
    setErreur(undefined)
  }

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motif) return setErreur(s.choisirRaison)
    setEnCours("signaler")
    const { error } = await supabase.rpc("signaler", {
      p_demande: demandeId,
      p_motif: motif,
      p_details: details.trim() || undefined,
      p_bloquer: bloquer,
    })
    setEnCours(null)
    if (error) return setErreur(messageErreur(error, t))
    toast.success(s.merci, { description: bloquer ? s.bloque(nom) : undefined })
    fermer()
    if (bloquer) onFait?.()
  }

  const bloquerSeulement = async () => {
    setEnCours("bloquer")
    const { error } = await supabase.rpc("bloquer_personne", { p_demande: demandeId })
    setEnCours(null)
    if (error) return setErreur(messageErreur(error, t))
    toast(s.bloque(nom), { description: s.bloqueTexte })
    fermer()
    onFait?.()
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title={s.boutonTitre}
        onClick={() => setOuverte(true)}
        className={cn("text-muted-foreground hover:text-destructive", className)}
      >
        <Flag /> {s.bouton}
      </Button>

      <Fenetre ouverte={ouverte} onFermer={fermer} titre={s.titre(nom)}>
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Flag className="size-6" />
        </div>
        <h2 className="pe-8 text-xl font-bold">{s.titre(nom)}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{s.texte}</p>

        <form onSubmit={envoyer} className="mt-5 flex flex-col gap-4">
          <div role="radiogroup" aria-label={s.raison} className="flex flex-col gap-2">
            <p className="text-sm font-semibold">{s.raison}</p>
            <div className="flex flex-wrap gap-2">
              {MOTIFS.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={motif === m}
                  onClick={() => {
                    setMotif(m)
                    setErreur(undefined)
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-all active:scale-95",
                    motif === m ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40"
                  )}
                >
                  {s.motifs[m]}
                </button>
              ))}
            </div>
          </div>

          {motif === "danger" && (
            <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              <Phone className="mt-0.5 size-4 shrink-0" /> {s.urgence}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor={`details-${demandeId}`} className="text-sm font-semibold">
              {s.details}
            </label>
            <textarea
              id={`details-${demandeId}`}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={s.detailsPh}
              maxLength={1000}
              rows={3}
              className="w-full rounded-xl border bg-card p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 text-sm">
            <input
              type="checkbox"
              checked={bloquer}
              onChange={(e) => setBloquer(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>{s.bloquerAussi}</span>
          </label>

          <MessageErreur message={erreur} />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={bloquerSeulement} disabled={!!enCours}>
              {enCours === "bloquer" ? <Loader2 className="animate-spin" /> : <Ban />} {s.bloquerSeul}
            </Button>
            <Button type="submit" variant="destructive" disabled={!!enCours}>
              {enCours === "signaler" ? <Loader2 className="animate-spin" /> : <Flag />} {s.envoyer}
            </Button>
          </div>
        </form>
      </Fenetre>
    </>
  )
}
