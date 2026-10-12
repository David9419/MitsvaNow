"use client"

import {
  Activity,
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  Clock,
  HandHeart,
  Inbox,
  Info,
  Star,
  Trophy,
  UserPlus,
  Users,
  Wifi,
} from "lucide-react"

import { Avatar } from "@/components/avatar"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { BadgeStatut } from "@/components/tableau/badge-statut"
import { CarteStat } from "@/components/tableau/carte-stat"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { ESPACES, type TypeIntervenant } from "@/lib/espaces"
import { ilYa, LOCALES, nomService } from "@/lib/i18n"
import type { NomsService, StatutDemande } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

/** Rôles affichés dans l'administration (les demandeurs + les 6 types d'intervenants). */
export type RoleAdmin = "demandeur" | TypeIntervenant
export const ROLES_ADMIN: RoleAdmin[] = ["demandeur", "bahour", "femme", "sofer", "rav", "rabbanit", "chaliah"]

type Personne = {
  id: string
  prenom: string
  nom: string | null
  photo_url: string | null
  espace_slug: string | null
  type_intervenant: TypeIntervenant | null
}

/** Ce que renvoie admin_statistiques. */
export type StatistiquesAdmin = {
  comptes: {
    total: number
    en_attente: number
    valides: number
    bloques: number
    aujourdhui: number
    semaine: number
    mois: number
    en_ligne: number
    actifs_jour: number
  }
  roles: Partial<Record<RoleAdmin, number>>
  disponibles: Partial<Record<TypeIntervenant, number>>
  par_jour: { jour: string; inscriptions: number; demandes: number }[]
  demandes: {
    total: number
    en_attente: number
    en_cours: number
    terminees: number
    annulees: number
    expirees: number
    aujourdhui: number
    semaine: number
  }
  avis: { nombre: number; moyenne: number | null }
  services: { nom: string; noms: NomsService | null; n: number }[]
  en_ligne: (Personne & { dernier_passage: string; disponible: boolean | null })[]
  inscriptions: (Personne & { created_at: string; verification: string })[]
  dernieres_demandes: {
    id: string
    statut: StatutDemande
    created_at: string
    service: string
    service_noms: NomsService | null
    demandeur: string
    intervenant: string | null
  }[]
  meilleurs: (Personne & { terminees: number; moyenne: number | null })[]
}

/** Icône de l'espace correspondant à un rôle. */
function iconeRole(role: RoleAdmin) {
  const espace = ESPACES.find((e) => (role === "demandeur" ? e.role === "demandeur" : e.types.some((x) => x === role)))
  return espace?.icon ?? Users
}

/** Tableau de bord : chiffres clés, inscrits par rôle, courbes, en ligne, dernières activités. */
export function TableauDeBordAdmin({
  stats,
  onVoirRole,
}: {
  stats: StatistiquesAdmin
  /** Ouvre la liste des comptes filtrée sur ce rôle (ou « en_ligne ») */
  onVoirRole: (role: RoleAdmin | "en_ligne") => void
}) {
  const t = useT()
  const a = t.admin
  const s = a.stats
  const langue = useLangue()
  const d = stats.demandes
  const finies = d.terminees + d.annulees + d.expirees
  const reussite = finies ? Math.round((d.terminees / finies) * 100) : 0
  const dispoTotal = Object.values(stats.disponibles).reduce((x, y) => x + (y ?? 0), 0)
  const libelleRole = (p: Personne) =>
    p.type_intervenant ? t.types[p.type_intervenant] : a.roles.demandeur

  return (
    <div className="flex flex-col gap-6">
      {/* Les chiffres clés */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button type="button" onClick={() => onVoirRole("en_ligne")} className="text-start">
          <CarteStat icon={Wifi} label={s.enLigne} valeur={stats.comptes.en_ligne} accent="success" detail={s.actifsJour(stats.comptes.actifs_jour)} />
        </button>
        <CarteStat icon={Users} label={s.inscrits} valeur={stats.comptes.total} accent="primary" detail={s.cetteSemaine(stats.comptes.semaine)} delai={60} />
        <CarteStat icon={Inbox} label={s.demandes} valeur={d.total} accent="primary" detail={s.demandesDetail(d.semaine)} delai={120} />
        <CarteStat icon={CheckCircle2} label={s.terminees} valeur={d.terminees} accent="success" detail={s.reussite(reussite)} delai={180} />
        <CarteStat icon={UserPlus} label={s.nouveauxAujourdhui} valeur={stats.comptes.aujourdhui} accent="primary" detail={s.ceMois(stats.comptes.mois)} delai={240} />
        <CarteStat icon={Clock} label={s.aVerifier} valeur={stats.comptes.en_attente} accent="muted" detail={s.aVerifierDetail} delai={300} />
        <CarteStat icon={HandHeart} label={s.disponibles} valeur={dispoTotal} accent="success" detail={s.disponiblesDetail} delai={360} />
        <div
          className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border bg-card p-5 shadow-sm duration-500 fill-mode-both"
          style={{ animationDelay: "420ms" }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">{s.note}</p>
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Star className="size-5" />
            </span>
          </div>
          <p className="mt-2 font-heading text-3xl font-bold tabular-nums">
            {stats.avis.moyenne != null ? `${stats.avis.moyenne.toLocaleString(LOCALES[langue])}/5` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{s.nbAvis(stats.avis.nombre)}</p>
        </div>
      </div>

      {/* Inscrits par rôle */}
      <CarteWidget icon={Users} titre={s.parRole} sousTitre={s.parRoleSous}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {ROLES_ADMIN.map((role) => {
            const Icone = iconeRole(role)
            const dispo = role === "demandeur" ? null : (stats.disponibles[role] ?? 0)
            return (
              <button
                key={role}
                type="button"
                onClick={() => onVoirRole(role)}
                className="group flex flex-col items-start gap-2 rounded-xl border bg-background p-3 text-start transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Icone className="size-4" />
                </span>
                <span className="font-heading text-2xl font-bold tabular-nums">{stats.roles[role] ?? 0}</span>
                <span className="text-xs leading-tight font-semibold">{a.roles[role]}</span>
                {dispo != null && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className={cn("size-1.5 rounded-full", dispo > 0 ? "bg-success" : "bg-muted-foreground/40")} />
                    {s.disponiblesN(dispo)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </CarteWidget>

      {/* Les deux courbes (une par mesure, pas de double axe) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Barres
          titre={s.inscriptionsJour}
          icon={CalendarPlus}
          valeurs={stats.par_jour.map((j) => ({ jour: j.jour, n: j.inscriptions }))}
          total={stats.comptes.mois}
        />
        <Barres
          titre={s.demandesJour}
          icon={BarChart3}
          valeurs={stats.par_jour.map((j) => ({ jour: j.jour, n: j.demandes }))}
          total={stats.par_jour.reduce((x, j) => x + j.demandes, 0)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Qui est en ligne */}
        <CarteWidget icon={Wifi} titre={s.enLigneTitre} sousTitre={s.enLigneSous}>
          {stats.en_ligne.length === 0 ? (
            <p className="text-sm text-muted-foreground">{s.personne}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.en_ligne.map((p) => (
                <LignePersonne key={p.id} p={p} detail={libelleRole(p)} droite={ilYa(p.dernier_passage, langue)} enLigne />
              ))}
            </ul>
          )}
        </CarteWidget>

        {/* Dernières inscriptions */}
        <CarteWidget icon={UserPlus} titre={s.dernieresInscriptions}>
          <ul className="flex flex-col gap-2">
            {stats.inscriptions.map((p) => (
              <LignePersonne key={p.id} p={p} detail={libelleRole(p)} droite={ilYa(p.created_at, langue)} />
            ))}
          </ul>
        </CarteWidget>

        {/* Dernières demandes */}
        <CarteWidget icon={Activity} titre={s.dernieresDemandes}>
          {stats.dernieres_demandes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{s.aucune}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {stats.dernieres_demandes.map((x) => (
                <li key={x.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{nomService(x.service_noms, x.service, langue)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {x.demandeur}
                      {x.intervenant ? ` → ${x.intervenant}` : ""} · {ilYa(x.created_at, langue)}
                    </p>
                  </div>
                  <BadgeStatut statut={x.statut} />
                </li>
              ))}
            </ul>
          )}
        </CarteWidget>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Services les plus demandés */}
        <CarteWidget icon={BarChart3} titre={s.services}>
          {stats.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">{s.aucune}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {stats.services.map((x) => (
                <li key={x.nom} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="truncate">{nomService(x.noms, x.nom, langue)}</span>
                    <span className="font-semibold tabular-nums">{x.n}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${(x.n / stats.services[0].n) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CarteWidget>

        {/* Ceux qui ont le plus aidé */}
        <CarteWidget icon={Trophy} titre={s.meilleurs}>
          {stats.meilleurs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{s.aucune}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.meilleurs.map((p) => (
                <LignePersonne
                  key={p.id}
                  p={p}
                  detail={`${libelleRole(p)} · ${s.mitsvot(p.terminees)}`}
                  droite={p.moyenne != null ? `★ ${p.moyenne}` : ""}
                />
              ))}
            </ul>
          )}
        </CarteWidget>

        {/* État des demandes */}
        <CarteWidget icon={Inbox} titre={s.etat}>
          <ul className="flex flex-col gap-2 text-sm">
            {(
              [
                ["en_attente", d.en_attente],
                ["en_cours", d.en_cours],
                ["terminee", d.terminees],
                ["annulee", d.annulees],
                ["expiree", d.expirees],
              ] as const
            ).map(([statut, n]) => (
              <li key={statut} className="flex items-center justify-between gap-2">
                <BadgeStatut statut={statut} />
                <span className="font-semibold tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </CarteWidget>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" /> {s.misAJour}. {s.visiteurs}
      </p>
    </div>
  )
}

/** Une personne dans une liste (photo, nom, rôle, et une info à droite). */
function LignePersonne({
  p,
  detail,
  droite,
  enLigne = false,
}: {
  p: Personne
  detail: string
  droite: string
  enLigne?: boolean
}) {
  const nom = [p.prenom, p.nom].filter(Boolean).join(" ")
  return (
    <li className="flex items-center gap-3">
      <span className="relative">
        <Avatar src={p.photo_url} nom={nom} className="size-9 text-sm" />
        {enLigne && <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-card" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{nom || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      {droite && <span className="shrink-0 text-xs text-muted-foreground">{droite}</span>}
    </li>
  )
}

/** Histogramme d'une seule mesure sur 30 jours (survol = valeur du jour). */
function Barres({
  titre,
  icon,
  valeurs,
  total,
}: {
  titre: string
  icon: typeof BarChart3
  valeurs: { jour: string; n: number }[]
  total: number
}) {
  const t = useT()
  const langue = useLangue()
  const max = Math.max(1, ...valeurs.map((v) => v.n))
  const date = (jour: string) =>
    new Date(`${jour}T12:00:00`).toLocaleDateString(LOCALES[langue], { day: "numeric", month: "short" })

  return (
    <CarteWidget icon={icon} titre={titre} sousTitre={t.admin.stats.total(total)}>
      <div className="flex h-36 items-end gap-0.5" dir="ltr" role="img" aria-label={titre}>
        {valeurs.map((v) => (
          <div key={v.jour} className="group relative flex h-full flex-1 items-end">
            <div
              className={cn(
                "w-full rounded-t-[4px] bg-primary transition-all duration-500 group-hover:bg-primary/70",
                v.n === 0 && "bg-muted"
              )}
              style={{ height: v.n === 0 ? "2px" : `${Math.max(6, (v.n / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 shadow-md ring-1 ring-border transition-opacity group-hover:opacity-100">
              {date(v.jour)} : <b className="tabular-nums">{v.n}</b>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground" dir="ltr">
        <span>{valeurs[0] && date(valeurs[0].jour)}</span>
        <span>{valeurs.at(-1) && date(valeurs.at(-1)!.jour)}</span>
      </div>
    </CarteWidget>
  )
}
