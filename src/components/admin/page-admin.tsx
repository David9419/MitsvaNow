"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Ban,
  Check,
  Clock,
  Flag,
  LayoutDashboard,
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

import {
  ROLES_ADMIN,
  TableauDeBordAdmin,
  type RoleAdmin,
  type StatistiquesAdmin,
} from "@/components/admin/tableau-de-bord-admin"
import { SignalementsAdmin, type SignalementAdmin } from "@/components/admin/signalements-admin"
import { Avatar } from "@/components/avatar"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { BarreTableau } from "@/components/tableau/barre-tableau"
import { Fenetre } from "@/components/tableau/fenetre"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { trouverEspace } from "@/lib/espaces"
import { ilYa } from "@/lib/i18n"
import { useMaintenant } from "@/hooks/use-maintenant"
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
  dernier_passage: string | null
  disponible: boolean | null
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
type Vue = "tableau" | "comptes" | "signalements"
type FiltreRole = "tous" | "en_ligne" | RoleAdmin
/** En ligne = passé sur le site dans les 3 dernières minutes */
const EN_LIGNE_MS = 3 * 60 * 1000

export function PageAdmin({
  utilisateurId,
  initial,
  statistiques,
  signalementsInitiaux,
}: {
  utilisateurId: string
  initial: CompteAdmin[]
  statistiques: StatistiquesAdmin | null
  signalementsInitiaux: SignalementAdmin[]
}) {
  const t = useT()
  const a = t.admin
  const langue = useLangue()
  const supabase = useRef(createClient()).current
  const [comptes, setComptes] = useState(initial)
  const [stats, setStats] = useState(statistiques)
  const [vue, setVue] = useState<Vue>("tableau")
  const [filtreRole, setFiltreRole] = useState<FiltreRole>("tous")
  const maintenant = useMaintenant(30000)
  const [onglet, setOnglet] = useState<Onglet>("attente")
  const [recherche, setRecherche] = useState("")
  const [enCours, setEnCours] = useState<string | null>(null)
  const [fenetre, setFenetre] = useState<{ compte: CompteAdmin; decision: "refuse" | "suspendu" } | null>(null)
  const [motif, setMotif] = useState("")
  const [signalements, setSignalements] = useState(signalementsInitiaux)
  const signalementsNouveaux = signalements.filter((x) => x.statut === "nouveau").length

  const recharger = useCallback(async () => {
    const [{ data }, { data: s }, { data: sig }] = await Promise.all([
      supabase.rpc("admin_comptes"),
      supabase.rpc("admin_statistiques"),
      supabase.rpc("admin_signalements"),
    ])
    if (data) setComptes(data as unknown as CompteAdmin[])
    if (s) setStats(s as unknown as StatistiquesAdmin)
    if (sig) setSignalements(sig as unknown as SignalementAdmin[])
  }, [supabase])

  // Mise à jour toute seule toutes les 30 secondes (nouvelles inscriptions, personnes en ligne…)
  useEffect(() => {
    const minuteur = setInterval(recharger, 30000)
    return () => clearInterval(minuteur)
  }, [recharger])

  /** Signalement traité (ou rouvert) */
  const traiterSignalement = async (id: string, traite: boolean) => {
    setEnCours(id)
    const { error } = await supabase.rpc("admin_traiter_signalement", { p_signalement: id, p_traite: traite })
    setEnCours(null)
    if (error) toast.error(messageErreur(error, t))
    await recharger()
  }

  /** Depuis un signalement : suspendre la personne (fenêtre avec motif) */
  const suspendreDepuisSignalement = (cibleId: string) => {
    const c = comptes.find((x) => x.id === cibleId)
    if (c && !c.est_admin) setFenetre({ compte: c, decision: "suspendu" })
  }

  /** Depuis le tableau de bord : ouvrir la liste des comptes filtrée */
  const voirRole = (role: RoleAdmin | "en_ligne") => {
    setFiltreRole(role)
    setOnglet("valides")
    setRecherche("")
    setVue("comptes")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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
      .filter((c) =>
        filtreRole === "tous"
          ? true
          : filtreRole === "en_ligne"
            ? c.dernier_passage != null && maintenant - new Date(c.dernier_passage).getTime() < EN_LIGNE_MS
            : (c.type_intervenant ?? "demandeur") === filtreRole
      )
      .filter(
        (c) =>
          !q ||
          [c.prenom, c.nom, c.email, c.telephone, c.communaute, c.referent]
            .filter(Boolean)
            .some((x) => x!.toLowerCase().includes(q))
      )
      // Dans « Validés », les comptes validés automatiquement (à revoir) d'abord
      .sort((x, y) => Number(y.valide_automatiquement) - Number(x.valide_automatiquement))
  }, [comptes, onglet, recherche, filtreRole, maintenant])

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
        <div className="mt-5 inline-flex flex-wrap gap-1 rounded-xl bg-current/10 p-1 ring-1 ring-current/15">
          {(
            [
              { id: "tableau", icon: LayoutDashboard },
              { id: "comptes", icon: Users },
              { id: "signalements", icon: Flag },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVue(v.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                vue === v.id ? "bg-background text-foreground shadow-md" : "hover:bg-current/10"
              )}
            >
              <v.icon className="size-4" /> {v.id === "signalements" ? t.signalement.admin.onglet : a.vues[v.id]}
              {v.id === "comptes" && nombres.attente > 0 && (
                <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground tabular-nums">{nombres.attente}</span>
              )}
              {v.id === "signalements" && signalementsNouveaux > 0 && (
                <span className="rounded-full bg-destructive px-2 text-xs text-white tabular-nums">{signalementsNouveaux}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {vue === "tableau" && stats && <TableauDeBordAdmin stats={stats} onVoirRole={voirRole} />}

      {vue === "signalements" && (
        <SignalementsAdmin
          liste={signalements}
          occupe={enCours}
          onTraiter={traiterSignalement}
          onSuspendre={suspendreDepuisSignalement}
        />
      )}

      {vue === "comptes" && (
      <>
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm">
        <p className="font-semibold">{a.conseilsTitre}</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-muted-foreground">
          {a.conseils.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {c}
            </li>
          ))}
        </ul>
      </div>

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

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["tous", "en_ligne", ...ROLES_ADMIN] as FiltreRole[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltreRole(f)}
            aria-pressed={filtreRole === f}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95",
              filtreRole === f ? "border-primary bg-primary text-primary-foreground shadow-md" : "bg-card hover:border-primary/40"
            )}
          >
            {f === "en_ligne" && <span className="size-2 rounded-full bg-success" />}
            {f === "tous" ? a.filtres.tous : f === "en_ligne" ? a.filtres.enLigne : a.roles[f]}
          </button>
        ))}
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
                  <span className="relative">
                    <Avatar src={c.photo_url} nom={nom} className="size-14 text-xl" />
                    {c.dernier_passage != null && maintenant - new Date(c.dernier_passage).getTime() < EN_LIGNE_MS && (
                      <span title={a.enLigne} className="absolute -end-0.5 -bottom-0.5 size-4 rounded-full bg-success ring-2 ring-card" />
                    )}
                  </span>
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
                  {(c.communaute || c.referent) && (
                  <>
                  <div className="rounded-xl bg-muted/50 p-2.5">
                    <dt className="text-xs font-semibold text-muted-foreground">{a.communaute}</dt>
                    <dd className={cn(!c.communaute && "text-muted-foreground italic")}>{c.communaute ?? a.nonRenseigne}</dd>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-2.5">
                    <dt className="text-xs font-semibold text-muted-foreground">{a.referent}</dt>
                    <dd className={cn(!c.referent && "text-muted-foreground italic")}>{c.referent ?? a.nonRenseigne}</dd>
                  </div>
                  </>
                  )}
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
      </>
      )}
    </main>
  )
}
