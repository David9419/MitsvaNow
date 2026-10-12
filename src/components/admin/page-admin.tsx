"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Ban,
  Check,
  Clock,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react"

import { Avatar } from "@/components/avatar"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { BarreTableau } from "@/components/tableau/barre-tableau"
import { Fenetre } from "@/components/tableau/fenetre"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { trouverEspace } from "@/lib/espaces"
import { ilYa } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { messageErreur } from "@/lib/tableau/outils"
import { cn } from "@/lib/utils"

type Verification = "en_attente" | "valide" | "refuse" | "suspendu"

/** Un compte, tel que le renvoie admin_comptes. */
export type CompteAdmin = {
  id: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  photo_url: string | null
  created_at: string
  verification: Verification
  communaute: string | null
  referent: string | null
  verifie_le: string | null
  motif_verification: string | null
  est_admin: boolean
  valide_automatiquement: boolean
  verifie_par_nom: string | null
  espace_slug: string | null
  type_intervenant: string | null
}

type Onglet = "attente" | "valides" | "bloques"
const DANS_ONGLET: Record<Onglet, Verification[]> = {
  attente: ["en_attente"],
  valides: ["valide"],
  bloques: ["refuse", "suspendu"],
}

/** Page Administration : vérifier les comptes avant de leur donner accès au site. */
export function PageAdmin({ utilisateurId, initial }: { utilisateurId: string; initial: CompteAdmin[] }) {
  const t = useT()
  const a = t.admin
  const langue = useLangue()
  const supabase = useRef(createClient()).current
  const [comptes, setComptes] = useState(initial)
  const [onglet, setOnglet] = useState<Onglet>("attente")
  const [recherche, setRecherche] = useState("")
  const [enCours, setEnCours] = useState<string | null>(null)
  const [fenetre, setFenetre] = useState<{ compte: CompteAdmin; decision: "refuse" | "suspendu" } | null>(null)
  const [motif, setMotif] = useState("")

  const recharger = useCallback(async () => {
    const { data } = await supabase.rpc("admin_comptes")
    if (data) setComptes(data as unknown as CompteAdmin[])
  }, [supabase])

  const decider = async (c: CompteAdmin, decision: Verification, raison?: string) => {
    setEnCours(c.id)
    const { error } = await supabase.rpc("admin_decider", {
      p_utilisateur: c.id,
      p_decision: decision,
      p_motif: raison,
    })
    setEnCours(null)
    if (error) {
      toast.error(messageErreur(error, t))
      return false
    }
    const nom = [c.prenom, c.nom].filter(Boolean).join(" ")
    if (decision === "valide") toast.success(a.toasts.valide(nom))
    else if (decision === "refuse") toast(a.toasts.refuse(nom))
    else if (decision === "suspendu") toast(a.toasts.suspendu(nom))
    await recharger()
    return true
  }

  const confirmerMotif = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fenetre || !motif.trim()) return
    if (await decider(fenetre.compte, fenetre.decision, motif.trim())) {
      setFenetre(null)
      setMotif("")
    }
  }

  const nombres = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(DANS_ONGLET) as Onglet[]).map((o) => [
          o,
          comptes.filter((c) => DANS_ONGLET[o].includes(c.verification)).length,
        ])
      ) as Record<Onglet, number>,
    [comptes]
  )

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return comptes
      .filter((c) => DANS_ONGLET[onglet].includes(c.verification))
      .filter(
        (c) =>
          !q ||
          [c.prenom, c.nom, c.email, c.telephone, c.communaute, c.referent]
            .filter(Boolean)
            .some((x) => x!.toLowerCase().includes(q))
      )
      // Dans « Validés », les comptes validés automatiquement (à revoir) d'abord
      .sort((x, y) => Number(y.valide_automatiquement) - Number(x.valide_automatiquement))
  }, [comptes, onglet, recherche])

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <Fenetre
        ouverte={fenetre != null}
        onFermer={() => setFenetre(null)}
        titre={fenetre ? a.motifTitre[fenetre.decision] : ""}
      >
        <form onSubmit={confirmerMotif} className="flex flex-col gap-4">
          <h2 className="pe-8 text-lg font-bold">{fenetre ? a.motifTitre[fenetre.decision] : ""}</h2>
          <p className="text-sm text-muted-foreground">{a.motifTexte}</p>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={a.motifPh}
            maxLength={300}
            required
            rows={3}
            className="w-full rounded-xl border bg-card p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setFenetre(null)}>
              {a.annuler}
            </Button>
            <Button type="submit" variant="destructive" disabled={!motif.trim() || enCours != null}>
              {enCours ? <Loader2 className="animate-spin" /> : null} {a.confirmer}
            </Button>
          </div>
        </form>
      </Fenetre>

      <BarreTableau icon={ShieldCheck} espace={a.titre} retour="/accueil" libelleRetour={a.retour} />

      <section className="animate-in fade-in slide-in-from-bottom-4 rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/75 p-6 text-primary-foreground shadow-xl duration-700 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-current/15 ring-1 ring-current/20">
            <ShieldCheck className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{a.titre}</h1>
            <p className="mt-1 opacity-85">{a.sousTitre}</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-current/10 p-4 text-sm ring-1 ring-current/15">
          <p className="font-semibold">{a.conseilsTitre}</p>
          <ul className="mt-2 flex flex-col gap-1.5 opacity-90">
            {a.conseils.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0" /> {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              { id: "attente", icon: Clock },
              { id: "valides", icon: UserCheck },
              { id: "bloques", icon: Ban },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOnglet(o.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-semibold transition-all",
                onglet === o.id ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <o.icon className="size-4 shrink-0" />
              <span className="truncate">{a.onglets[o.id]}</span>
              <span
                className={cn(
                  "rounded-full px-2 text-xs tabular-nums",
                  o.id === "attente" && nombres.attente > 0 ? "bg-primary text-primary-foreground" : "bg-background"
                )}
              >
                {nombres[o.id]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={a.recherche}
            className="h-11 bg-card ps-9"
          />
        </div>
      </div>

      <div key={onglet} className="flex flex-col gap-3">
        {liste.length === 0 ? (
          <div className="flex animate-in fade-in flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-6" />
            </span>
            <p className="font-semibold">{onglet === "attente" && !recherche ? a.videAttente : a.vide}</p>
          </div>
        ) : (
          liste.map((c, i) => {
            const nom = [c.prenom, c.nom].filter(Boolean).join(" ")
            const espace = trouverEspace(c.espace_slug ?? undefined)
            const occupe = enCours === c.id
            return (
              <article
                key={c.id}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-2xl border bg-card p-4 shadow-sm duration-500 sm:p-5",
                  c.verification === "en_attente" && "border-primary/40 ring-1 ring-primary/15",
                  c.valide_automatiquement && "border-dashed"
                )}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar src={c.photo_url} nom={nom} className="size-14 text-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg leading-tight font-bold">{nom || "—"}</h2>
                      {c.est_admin && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {a.administrateur}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                      {espace && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium">
                          <espace.icon className="size-3" /> {t.espaces[espace.slug].nom}
                        </span>
                      )}
                      {c.type_intervenant && (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                          {t.types[c.type_intervenant as keyof typeof t.types] ?? c.type_intervenant}
                        </span>
                      )}
                      <span className="rounded-full px-2 py-0.5 text-muted-foreground">
                        {a.inscrit(ilYa(c.created_at, langue))}
                      </span>
                    </div>
                  </div>
                  {c.telephone && (
                    <Button asChild size="sm" className="bg-success text-success-foreground hover:bg-success/90">
                      <a href={`tel:${c.telephone}`}>
                        <Phone /> {a.appeler}
                      </a>
                    </Button>
                  )}
                </div>

                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4 shrink-0" />
                    <span className="truncate" dir="ltr">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4 shrink-0" />
                    <span dir="ltr">{c.telephone ?? a.nonRenseigne}</span>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-2.5">
                    <dt className="text-xs font-semibold text-muted-foreground">{a.communaute}</dt>
                    <dd className={cn(!c.communaute && "text-muted-foreground italic")}>{c.communaute ?? a.nonRenseigne}</dd>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-2.5">
                    <dt className="text-xs font-semibold text-muted-foreground">{a.referent}</dt>
                    <dd className={cn(!c.referent && "text-muted-foreground italic")}>{c.referent ?? a.nonRenseigne}</dd>
                  </div>
                </dl>

                {(c.valide_automatiquement || c.verifie_par_nom || c.motif_verification) && (
                  <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                    {c.valide_automatiquement ? (
                      <p className="flex items-center gap-1.5 font-medium text-primary">
                        <ShieldAlert className="size-3.5" /> {a.automatique}
                      </p>
                    ) : (
                      c.verifie_par_nom &&
                      c.verifie_le && <p>{a.verifiePar(c.verifie_par_nom, ilYa(c.verifie_le, langue))}</p>
                    )}
                    {!c.valide_automatiquement && c.motif_verification && (
                      <p>
                        {t.verification.motif} : {c.motif_verification}
                      </p>
                    )}
                  </div>
                )}

                {!c.est_admin && c.id !== utilisateurId && (
                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">
                    {c.verification === "en_attente" && (
                      <>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={occupe} onClick={() => setFenetre({ compte: c, decision: "refuse" })}>
                          <X /> {a.refuser}
                        </Button>
                        <Button size="sm" disabled={occupe} onClick={() => decider(c, "valide")}>
                          {occupe ? <Loader2 className="animate-spin" /> : <Check />} {a.valider}
                        </Button>
                      </>
                    )}
                    {c.verification === "valide" && (
                      <>
                        {c.valide_automatiquement && (
                          <Button size="sm" variant="outline" disabled={occupe} onClick={() => decider(c, "valide")}>
                            {occupe ? <Loader2 className="animate-spin" /> : <Check />} {a.valider}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={occupe} onClick={() => setFenetre({ compte: c, decision: "suspendu" })}>
                          <Ban /> {a.suspendre}
                        </Button>
                      </>
                    )}
                    {(c.verification === "refuse" || c.verification === "suspendu") && (
                      <Button size="sm" variant="outline" disabled={occupe} onClick={() => decider(c, "valide")}>
                        {occupe ? <Loader2 className="animate-spin" /> : <RotateCcw />} {a.reactiver}
                      </Button>
                    )}
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>
    </main>
  )
}
