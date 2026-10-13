"use client"

import { Ban, Check, Flag, Phone, RotateCcw, ShieldBan, Users } from "lucide-react"

import { Avatar } from "@/components/avatar"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"
import { ilYa, nomService } from "@/lib/i18n"
import type { NomsService } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

type PersonneSignalement = {
  id: string | null
  prenom: string | null
  nom: string | null
  telephone: string | null
  photo: string | null
}

/** Un signalement, tel que le renvoie admin_signalements. */
export type SignalementAdmin = {
  id: string
  motif: "comportement" | "harcelement" | "faux_profil" | "absence" | "danger" | "autre"
  details: string | null
  bloque: boolean
  statut: "nouveau" | "traite"
  created_at: string
  traite_le: string | null
  traite_par_nom: string | null
  auteur: PersonneSignalement
  cible: PersonneSignalement & {
    verification: string
    type_intervenant: string | null
    nb_signalements: number
  }
  service: string | null
  service_noms: NomsService | null
}

/** Administration : la liste des signalements (nouveaux d'abord). */
export function SignalementsAdmin({
  liste,
  occupe,
  onTraiter,
  onSuspendre,
}: {
  liste: SignalementAdmin[]
  occupe: string | null
  onTraiter: (id: string, traite: boolean) => void
  onSuspendre: (cibleId: string) => void
}) {
  const t = useT()
  const s = t.signalement
  const a = t.admin
  const langue = useLangue()

  if (liste.length === 0) {
    return (
      <div className="flex animate-in fade-in flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="size-6" />
        </span>
        <p className="font-semibold">{s.admin.vide}</p>
      </div>
    )
  }

  const nomDe = (p: PersonneSignalement) => [p.prenom, p.nom].filter(Boolean).join(" ") || s.admin.compteSupprime

  return (
    <div className="flex flex-col gap-3">
      {liste.map((x, i) => {
        const nouveau = x.statut === "nouveau"
        return (
          <article
            key={x.id}
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            className={cn(
              "animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-2xl border bg-card p-4 shadow-sm duration-500 sm:p-5",
              nouveau ? "border-destructive/40 ring-1 ring-destructive/15" : "opacity-80"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Flag className="size-4" />
                </span>
                <span className="font-semibold">{s.motifs[x.motif]}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-semibold",
                    nouveau ? "bg-destructive/10 text-destructive" : "bg-success/15 text-success"
                  )}
                >
                  {nouveau ? s.admin.nouveau : s.admin.traite}
                </span>
                <span className="text-muted-foreground">{ilYa(x.created_at, langue)}</span>
              </div>
            </div>

            {x.details && <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm">« {x.details} »</p>}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(
                [
                  [s.admin.personne, x.cible],
                  [s.admin.auteur, x.auteur],
                ] as const
              ).map(([titre, p]) => (
                <div key={titre} className="flex items-center gap-3 rounded-xl border p-3">
                  <Avatar src={p.photo} nom={nomDe(p)} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">{titre}</p>
                    <p className="truncate text-sm font-semibold">{nomDe(p)}</p>
                    {p === x.cible && (
                      <p className="text-xs text-muted-foreground">
                        {x.cible.type_intervenant
                          ? (t.types[x.cible.type_intervenant as keyof typeof t.types] ?? x.cible.type_intervenant)
                          : a.roles.demandeur}
                        {" · "}
                        {s.admin.nbFois(x.cible.nb_signalements)}
                      </p>
                    )}
                  </div>
                  {p.telephone && (
                    <Button asChild size="icon" variant="outline" className="shrink-0 rounded-full" title={a.appeler}>
                      <a href={`tel:${p.telephone}`} aria-label={a.appeler}>
                        <Phone />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
              {x.service && (
                <p>
                  {s.admin.service} : {nomService(x.service_noms, x.service, langue)}
                </p>
              )}
              {x.bloque && (
                <p className="flex items-center gap-1.5">
                  <Ban className="size-3.5" /> {s.admin.aussiBloque}
                </p>
              )}
              {!nouveau && x.traite_par_nom && x.traite_le && (
                <p>{s.admin.traitePar(x.traite_par_nom, ilYa(x.traite_le, langue))}</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">
              {x.cible.id && x.cible.verification !== "suspendu" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onSuspendre(x.cible.id!)}
                >
                  <ShieldBan /> {a.suspendre}
                </Button>
              ) : (
                x.cible.verification === "suspendu" && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3.5" /> {s.admin.dejaSuspendu}
                  </span>
                )
              )}
              {nouveau ? (
                <Button size="sm" onClick={() => onTraiter(x.id, true)} disabled={occupe === x.id}>
                  <Check /> {s.admin.marquerTraite}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onTraiter(x.id, false)} disabled={occupe === x.id}>
                  <RotateCcw /> {s.admin.rouvrir}
                </Button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
