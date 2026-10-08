"use client"

import { useState } from "react"
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  Ruler,
  Timer,
  X,
} from "lucide-react"

import { Avatar } from "@/components/avatar"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { ResumeNote } from "@/components/tableau/etoiles"
import { ListeAvis } from "@/components/tableau/liste-avis"
import { ICONES_TRANSPORT } from "@/components/tableau/transport"
import { Button } from "@/components/ui/button"
import { libelleType, trouverEspace } from "@/lib/espaces"
import { formaterDateHeure, formaterDistance, formaterHeure, ilYa, nomService } from "@/lib/i18n"
import type { DemandeDemandeur } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

const ETAPES = ["en_attente", "acceptee", "en_cours", "terminee"] as const

/** Suivi en direct d'une demande en cours. */
export function SuiviDemande({
  demande: d,
  onAnnuler,
  onConfirmer,
}: {
  demande: DemandeDemandeur
  onAnnuler: (d: DemandeDemandeur) => void
  onConfirmer: (id: string, confirmer: boolean) => Promise<void>
}) {
  const t = useT()
  const s = t.suivi
  const langue = useLangue()
  const [enCours, setEnCours] = useState<"oui" | "non" | null>(null)
  const [voirAvis, setVoirAvis] = useState(false)
  const etape = ETAPES.findIndex((e) => e === d.statut)
  const espace = trouverEspace(d.espace_slug)
  const Icone = espace?.icon ?? MapPin
  const service = nomService(d.service_noms, d.service, langue)
  const nomIntervenant = [d.intervenant_prenom, d.intervenant_nom].filter(Boolean).join(" ")
  const IconeTransport = d.transport ? ICONES_TRANSPORT[d.transport] : null
  const avis = d.intervenant_avis
  // Heure d'arrivée annoncée = moment de l'acceptation + délai
  const arrivee =
    d.eta_minutes != null && d.acceptee_le && !d.programmee_pour
      ? new Date(new Date(d.acceptee_le).getTime() + d.eta_minutes * 60000)
      : null

  const confirmer = async (oui: boolean) => {
    setEnCours(oui ? "oui" : "non")
    try {
      await onConfirmer(d.id, oui)
    } finally {
      setEnCours(null)
    }
  }

  return (
    <article className="relative animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-3xl border bg-card p-5 shadow-lg duration-700 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icone className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {espace ? t.espaces[espace.slug].nom : d.espace_nom}
            </p>
            <h3 className="font-heading text-lg leading-snug font-bold">{service}</h3>
            <p className="text-xs text-muted-foreground">{s.demandee(ilYa(d.created_at, langue))}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onAnnuler(d)}
        >
          <X /> {s.annuler}
        </Button>
      </div>

      {d.programmee_pour && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
          <CalendarClock className="size-4 shrink-0" />
          <span className="first-letter:uppercase">{t.tableau.prevueLe(formaterDateHeure(d.programmee_pour, langue))}</span>
        </p>
      )}

      {/* Frise des étapes */}
      <ol className="relative mt-6 grid grid-cols-4">
        <div className="absolute start-[12.5%] end-[12.5%] top-4 h-1 rounded-full bg-muted" />
        <div
          className="absolute start-[12.5%] top-4 h-1 rounded-full bg-gradient-to-r from-primary to-success transition-all duration-1000 ease-out rtl:bg-gradient-to-l"
          style={{ width: `${(Math.max(0, etape) / 3) * 75}%` }}
        />
        {s.etapes.map((label, i) => {
          const fait = i < etape
          const actuel = i === etape
          return (
            <li key={label} className="relative flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-full border-2 bg-card text-xs font-bold transition-all duration-500",
                  fait && "border-success bg-success text-success-foreground",
                  actuel && "scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                  !fait && !actuel && "border-border text-muted-foreground"
                )}
              >
                {actuel && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />}
                {fait ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("text-xs font-medium", actuel ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            </li>
          )
        })}
      </ol>

      {/* Détail selon le statut */}
      <div className="mt-6">
        {d.statut === "en_attente" ? (
          <div className="flex flex-col gap-3">
          {d.annulee_par === "intervenant" && (
            <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <RotateCcw className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{s.relanceTitre}</p>
                <p className="text-muted-foreground">{s.relanceTexte}</p>
                {d.motif_annulation && (
                  <p className="mt-1 text-muted-foreground italic">
                    {t.tableau.motif} : {d.motif_annulation}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 rounded-2xl bg-primary/5 p-4">
            <div className="relative size-14 shrink-0">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute inset-0 animate-radar rounded-full border-2 border-primary/50"
                  style={{ animationDelay: `${i}s` }}
                />
              ))}
              <span className="absolute inset-3 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                <MapPin className="size-4" />
              </span>
            </div>
            <div>
              <p className="font-semibold">{d.nb_proposes > 0 ? s.envoyeeA(d.nb_proposes) : s.recherche}</p>
              <p className="text-sm text-muted-foreground">
                {d.nb_proposes > 0 ? s.premier : d.programmee_pour ? s.programmeeAttente : s.personne}
              </p>
            </div>
          </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl border p-4",
              d.statut === "acceptee" && !d.confirmee ? "border-primary/30 bg-primary/5" : "border-success/40 bg-success/10"
            )}
          >
            {/* L'intervenant */}
            <div className="flex flex-wrap items-center gap-4">
              <Avatar src={d.intervenant_photo} nom={nomIntervenant} className="size-16 text-2xl shadow-lg ring-4 ring-card" />
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-tight font-bold">{nomIntervenant}</p>
                <p className="text-sm text-muted-foreground">
                  {libelleType(d.intervenant_type, t)} · {d.statut === "en_cours" ? s.enRoute : s.aAccepte}
                </p>
                {avis && <ResumeNote moyenne={avis.moyenne} nombre={avis.nombre} className="mt-1 text-sm" />}
              </div>
              {d.intervenant_telephone && (
                <Button asChild className="bg-success text-success-foreground hover:bg-success/90">
                  <a href={`tel:${d.intervenant_telephone}`}>
                    <Phone /> {t.commun.appeler}
                  </a>
                </Button>
              )}
            </div>

            {/* Comment il vient, quand il arrive */}
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {IconeTransport && (
                <p className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 text-sm font-semibold">
                  <IconeTransport className="size-5 shrink-0 text-primary" /> {t.transports[d.transport!]}
                </p>
              )}
              {d.eta_minutes != null && (
                <p className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 text-sm font-semibold">
                  <Timer className="size-5 shrink-0 text-primary" />
                  <span>
                    {s.arriveDans(d.eta_minutes)}
                    {arrivee && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {s.arriveeVers(formaterHeure(arrivee, langue))}
                      </span>
                    )}
                  </span>
                </p>
              )}
              {d.distance_m != null && (
                <p className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 text-sm font-semibold">
                  <Ruler className="size-5 shrink-0 text-primary" /> {t.tableau.aDeVous(formaterDistance(d.distance_m, langue))}
                </p>
              )}
            </div>

            {/* Ses avis */}
            {avis && avis.nombre > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setVoirAvis((v) => !v)}
                  className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {voirAvis ? s.masquerAvis : s.voirAvis(avis.nombre)}
                  <ChevronDown className={cn("size-4 transition-transform", voirAvis && "rotate-180")} />
                </button>
                {voirAvis && (
                  <div className="mt-3 max-h-80 animate-in fade-in overflow-y-auto pe-1">
                    <ListeAvis
                      avis={avis.liste.map((a, i) => ({
                        cle: `${a.created_at}-${i}`,
                        nom: `${a.prenom} ${a.initiale ? `${a.initiale}.` : ""}`.trim(),
                        note: a.note,
                        commentaire: a.commentaire,
                        created_at: a.created_at,
                      }))}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Le demandeur confirme, ou demande quelqu'un d'autre */}
            {d.statut === "acceptee" && !d.confirmee && (
              <div className="mt-4 rounded-xl bg-card p-4">
                <p className="font-semibold">{s.confirmerTitre}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.confirmerTexte}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Button
                    onClick={() => confirmer(true)}
                    disabled={!!enCours}
                    className="bg-success text-success-foreground hover:bg-success/90"
                  >
                    {enCours === "oui" ? <Loader2 className="animate-spin" /> : <Check />} {s.confirmer}
                  </Button>
                  <Button variant="outline" onClick={() => confirmer(false)} disabled={!!enCours}>
                    {enCours === "non" ? <Loader2 className="animate-spin" /> : <RotateCcw />} {s.refuser}
                  </Button>
                </div>
              </div>
            )}
            {d.statut === "acceptee" && d.confirmee && (
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-success">
                <CheckCircle2 className="size-4" /> {s.confirme}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
