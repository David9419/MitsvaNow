"use client"

import { useState } from "react"
import { CalendarClock, Check, Loader2, MapPin } from "lucide-react"

import { Avatar } from "@/components/avatar"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { Fenetre } from "@/components/tableau/fenetre"
import { ICONES_TRANSPORT } from "@/components/tableau/transport"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formaterDateHeure, formaterDistance, nomService } from "@/lib/i18n"
import { TRANSPORTS, type DemandeIntervenant, type Transport } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

const DELAIS = [5, 10, 15, 20, 30, 45, 60]

/**
 * Avant d'accepter : l'intervenant dit comment il vient (à pied, trottinette,
 * vélo, voiture, transports) et dans combien de temps il arrive.
 */
export function FenetreAcceptation({
  demande: d,
  onFermer,
  onValider,
}: {
  demande: DemandeIntervenant | null
  onFermer: () => void
  onValider: (id: string, transport: Transport, eta: number | null) => Promise<boolean>
}) {
  const t = useT()
  const langue = useLangue()
  const a = t.intervenant.acceptation
  const [transport, setTransport] = useState<Transport | null>(null)
  const [delai, setDelai] = useState<number | null>(null)
  const [autre, setAutre] = useState("")
  const [modeAutre, setModeAutre] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const fermer = () => {
    setTransport(null)
    setDelai(null)
    setAutre("")
    setModeAutre(false)
    setErreur(null)
    onFermer()
  }

  if (!d) return null
  const programmee = Boolean(d.programmee_pour)
  const eta = modeAutre ? Number(autre) : delai
  const etaValide = programmee || (eta != null && Number.isInteger(eta) && eta >= 1 && eta <= 720)
  const nom = `${d.demandeur_prenom} ${d.demandeur_nom ?? ""}`.trim()

  const valider = async () => {
    if (!transport) return setErreur(a.choisirTransport)
    if (!etaValide) return setErreur(a.choisirDelai)
    setErreur(null)
    setEnvoi(true)
    const ok = await onValider(d.id, transport, programmee ? null : eta)
    setEnvoi(false)
    if (ok) fermer()
  }

  return (
    <Fenetre ouverte onFermer={fermer} titre={a.titre}>
      <h2 className="pe-8 text-xl font-bold">{a.titre}</h2>

      {/* Qui, quoi, où */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border bg-card p-3">
        <Avatar src={d.demandeur_photo} nom={nom} className="size-12 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{nom}</p>
          <p className="truncate text-sm text-primary">{nomService(d.service_noms, d.service, langue)}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" /> {t.tableau.a(formaterDistance(d.distance_m, langue))}
            {d.adresse && ` · ${d.adresse}`}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{a.texte(d.demandeur_prenom)}</p>

      {/* Moyen de transport */}
      <p className="mt-5 mb-2 text-sm font-semibold">{a.comment}</p>
      <div className="grid grid-cols-5 gap-2">
        {TRANSPORTS.map((x) => {
          const Icone = ICONES_TRANSPORT[x]
          const actif = transport === x
          return (
            <button
              key={x}
              type="button"
              onClick={() => setTransport(x)}
              aria-pressed={actif}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border-2 bg-card px-1 py-2.5 text-[11px] leading-tight font-semibold transition-all active:scale-95",
                actif ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/15" : "border-border hover:border-primary/40"
              )}
            >
              <Icone className="size-5" />
              <span className="text-center">{t.transports[x]}</span>
            </button>
          )
        })}
      </div>

      {/* Délai d'arrivée (pas pour une demande programmée : l'heure est déjà fixée) */}
      {programmee ? (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-sm">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
          {a.programmee(formaterDateHeure(d.programmee_pour!, langue))}
        </p>
      ) : (
        <>
          <p className="mt-5 mb-2 text-sm font-semibold">{a.dansCombien}</p>
          <div className="flex flex-wrap gap-2">
            {DELAIS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setDelai(m)
                  setModeAutre(false)
                }}
                aria-pressed={!modeAutre && delai === m}
                className={cn(
                  "rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold tabular-nums transition-all active:scale-95",
                  !modeAutre && delai === m
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {m} {t.commun.minutes}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setModeAutre(true)}
              aria-pressed={modeAutre}
              className={cn(
                "rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-all active:scale-95",
                modeAutre ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card hover:border-primary/40"
              )}
            >
              {a.autre}
            </button>
          </div>
          {modeAutre && (
            <div className="mt-3 flex animate-in fade-in items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={720}
                autoFocus
                value={autre}
                onChange={(e) => setAutre(e.target.value)}
                className="h-11 w-28 bg-card text-center text-base"
              />
              <span className="text-sm text-muted-foreground">{a.minutes}</span>
            </div>
          )}
        </>
      )}

      {erreur && <p className="mt-4 animate-secoue text-sm font-medium text-destructive">{erreur}</p>}

      <div className="mt-6 flex flex-col gap-2">
        <Button
          size="lg"
          onClick={valider}
          disabled={envoi}
          className="h-12 bg-success text-base text-success-foreground shadow-lg shadow-success/25 hover:bg-success/90"
        >
          {envoi ? <Loader2 className="animate-spin" /> : <Check />}
          {a.valider}
        </Button>
        <Button variant="ghost" onClick={fermer} disabled={envoi}>
          {t.commun.annuler}
        </Button>
      </div>
    </Fenetre>
  )
}
