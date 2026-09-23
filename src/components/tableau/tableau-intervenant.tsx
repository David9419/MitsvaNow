"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import {
  BellRing,
  CheckCircle2,
  Hourglass,
  Inbox,
  LogOut,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { deconnexion } from "@/app/(auth)/actions"
import { BanniereLocalisation } from "@/components/tableau/banniere-localisation"
import { CarteDemandeIntervenant } from "@/components/tableau/carte-demande-intervenant"
import { CarteLocalisation } from "@/components/tableau/carte-disponibilite"
import { CarteServices } from "@/components/tableau/carte-services"
import { CarteStat } from "@/components/tableau/carte-stat"
import { EnTeteTableau, PastilleEnTete } from "@/components/tableau/en-tete-tableau"
import { WidgetBahourim } from "@/components/tableau/widgets/widget-bahourim"
import { WidgetChabbat } from "@/components/tableau/widgets/widget-chabbat"
import { WidgetChaliah } from "@/components/tableau/widgets/widget-chaliah"
import { WidgetSofer } from "@/components/tableau/widgets/widget-sofer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { distanceMetres, useLocalisation } from "@/hooks/use-localisation"
import { useTempsReel } from "@/hooks/use-temps-reel"
import type { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import { ESPACES, libelleType } from "@/lib/espaces"
import { demanderPermissionNotifications, jouerSon, notifierNavigateur } from "@/lib/tableau/alertes"
import { debutDeSemaine, formaterDistance, messageErreur } from "@/lib/tableau/outils"
import type { DonneesIntervenant } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

/** Ce qui change d'un espace à l'autre : couleurs, textes, libellés, outils. */
const CONFIG: Record<
  string,
  {
    theme: string
    accroche: (prenom: string) => string
    texte: string
    terminees: { label: string; icon: LucideIcon }
  }
> = {
  bahourim: {
    theme: "bg-gradient-to-br from-primary via-primary to-primary/75 text-primary-foreground",
    accroche: (p) => `Prêt pour le mivtsa, ${p} ?`,
    texte: "Activez votre disponibilité : les personnes proches qui veulent mettre les téfilines vous seront proposées en direct.",
    terminees: { label: "Mitsvot accomplies", icon: Sparkles },
  },
  "equipe-feminine": {
    theme: "bg-gradient-to-br from-accent via-accent to-accent/70 text-accent-foreground",
    accroche: (p) => `Bonjour ${p}, Chabbat approche !`,
    texte: "'Hallot, bougies, accompagnement : recevez les demandes des femmes et des familles près de chez vous.",
    terminees: { label: "Visites réalisées", icon: Sparkles },
  },
  "sofer-rav-rabbanit": {
    theme: "bg-gradient-to-br from-success via-success to-success/75 text-success-foreground",
    accroche: (p) => `Bienvenue, ${p}`,
    texte: "Cachérisations, vérifications, questions de halakha : gérez vos consultations et vos rendez-vous.",
    terminees: { label: "Consultations faites", icon: CheckCircle2 },
  },
  chaliah: {
    theme: "bg-gradient-to-br from-foreground via-foreground to-foreground/85 text-background",
    accroche: (p) => `Chalom ${p}`,
    texte: "Cours, accompagnement, orientation : suivez les personnes que vous guidez, à leur rythme.",
    terminees: { label: "Séances données", icon: CheckCircle2 },
  },
}

type Onglet = "a-traiter" | "en-cours" | "historique"

export function TableauIntervenant({
  utilisateurId,
  prenom,
  initial,
}: {
  utilisateurId: string
  prenom: string
  initial: DonneesIntervenant
}) {
  const [donnees, setDonnees] = useState(initial)
  const [onglet, setOnglet] = useState<Onglet>("a-traiter")
  const supabase = useRef(createClient()).current
  const dejaVues = useRef(new Set(initial.demandes.filter((d) => d.statut === "en_attente").map((d) => d.id)))

  const moi = donnees.intervenant!
  const espace = ESPACES.find((e) => e.slug === moi.espace_slug) ?? ESPACES[1]
  const config = CONFIG[moi.espace_slug] ?? CONFIG.bahourim
  const valide = moi.validation === "valide"
  const loc = useLocalisation({ suivre: moi.disponible })

  // ---------- Chargement + alertes pour les nouvelles demandes ----------
  const charger = useCallback(async () => {
    const { data, error } = await supabase.rpc("tableau_intervenant")
    if (error || !data) return
    const d = data as unknown as DonneesIntervenant
    const nouvelles = d.demandes.filter((x) => x.statut === "en_attente" && !dejaVues.current.has(x.id))
    nouvelles.forEach((x) => {
      dejaVues.current.add(x.id)
      jouerSon()
      toast.success(`Nouvelle demande : ${x.service}`, {
        description: `${x.demandeur_prenom} à ${formaterDistance(x.distance_m)} de vous`,
        icon: <BellRing className="size-4" />,
      })
      notifierNavigateur("Nouvelle demande Mivtsa Now", `${x.service} — à ${formaterDistance(x.distance_m)}`)
    })
    setDonnees(d)
  }, [supabase])

  useTempsReel("intervenant_id", utilisateurId, charger)

  // ---------- Appels au serveur ----------
  const appeler = useCallback(
    async (args: Database["public"]["Functions"]["mettre_a_jour_intervenant"]["Args"]) => {
      const { error } = await supabase.rpc("mettre_a_jour_intervenant", args)
      if (error) throw error
      await charger()
    },
    [supabase, charger]
  )

  // Envoi de la position quand elle change (au moins 150 m ou 2 min)
  const dernierEnvoi = useRef<{ lat: number; lng: number; t: number } | null>(null)
  useEffect(() => {
    const p = loc.position
    if (!p) return
    const d = dernierEnvoi.current
    if (d && distanceMetres(d, p) < 150 && Date.now() - d.t < 120000) return
    dernierEnvoi.current = { lat: p.lat, lng: p.lng, t: Date.now() }
    appeler({ p_lat: p.lat, p_lng: p.lng }).catch(() => {})
  }, [loc.position, appeler])

  const activerLocalisation = async () => {
    const p = await loc.activer()
    if (p) toast.success("Localisation activée", { description: "Votre position est à jour." })
    else toast.error("Localisation refusée", { description: "Autorisez-la dans les réglages du navigateur." })
  }

  const changerDisponibilite = async (dispo: boolean) => {
    try {
      let p = loc.position
      if (dispo && !p) p = await loc.activer()
      if (dispo && !p && moi.lat == null) {
        toast.error("Activez d'abord votre localisation pour recevoir des demandes.")
        return
      }
      if (dispo) demanderPermissionNotifications()
      await appeler({ p_disponible: dispo, ...(p ? { p_lat: p.lat, p_lng: p.lng } : {}) })
      toast(dispo ? "Vous êtes disponible" : "Vous êtes en pause", {
        description: dispo
          ? "Les demandes proches vous seront proposées en direct."
          : "Vous ne recevrez plus de nouvelles demandes.",
      })
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  const repondre = async (id: string, accepter: boolean) => {
    const { error } = await supabase.rpc("repondre_demande", { p_demande: id, p_accepter: accepter })
    if (error) toast.error(messageErreur(error))
    else {
      toast.success(accepter ? "Demande acceptée !" : "Demande refusée", {
        description: accepter
          ? "L'adresse et le téléphone sont maintenant affichés."
          : "Elle a été proposée à l'intervenant suivant.",
      })
      if (accepter) setOnglet("en-cours")
    }
    await charger()
  }

  const avancer = async (id: string) => {
    const { data, error } = await supabase.rpc("avancer_demande", { p_demande: id })
    if (error) toast.error(messageErreur(error))
    else if (data === "terminee") toast.success("Mission terminée, bravo ! 🎉", { description: "Merci pour cette mitsva." })
    else toast("Bonne route !", { description: "La personne est prévenue que vous arrivez." })
    await charger()
  }

  const basculerService = async (id: string, propose: boolean) => {
    const { error } = propose
      ? await supabase.from("intervenant_services").insert({ intervenant_id: utilisateurId, service_id: id })
      : await supabase.from("intervenant_services").delete().eq("intervenant_id", utilisateurId).eq("service_id", id)
    if (error) toast.error(messageErreur(error))
    await charger()
  }

  // ---------- Chiffres ----------
  const demandes = donnees.demandes
  const aTraiter = demandes.filter((d) => d.statut === "en_attente")
  const enCours = demandes.filter((d) => d.statut === "acceptee" || d.statut === "en_cours")
  const historique = demandes.filter((d) => d.statut === "terminee" || d.statut === "annulee")
  const terminees = demandes.filter((d) => d.statut === "terminee")
  const semaine = terminees.filter((d) => new Date(d.updated_at) >= debutDeSemaine()).length
  const listes: Record<Onglet, typeof demandes> = { "a-traiter": aTraiter, "en-cours": enCours, historique }

  const widget: Record<string, ReactNode> = {
    bahourim: <WidgetBahourim demandes={demandes} />,
    "equipe-feminine": <WidgetChabbat position={loc.position ?? (moi.lat != null ? { lat: moi.lat, lng: moi.lng! } : null)} />,
    "sofer-rav-rabbanit": <WidgetSofer demandes={demandes} />,
    chaliah: <WidgetChaliah demandes={demandes} />,
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <BanniereLocalisation
        etat={loc.etat}
        onActiver={activerLocalisation}
        texte="Pour recevoir les demandes des personnes proches de vous, Mivtsa Now a besoin de votre position."
      />

      <EnTeteTableau
        icon={espace.icon}
        theme={config.theme}
        surtitre={`Espace ${espace.nom}`}
        titre={config.accroche(prenom)}
        texte={config.texte}
        badges={
          <>
            <PastilleEnTete>{libelleType(moi.type)}</PastilleEnTete>
            <PastilleEnTete>
              {valide ? "✓ Profil validé" : moi.validation === "refuse" ? "Profil refusé" : "⏳ En attente de validation"}
            </PastilleEnTete>
          </>
        }
        droite={
          <div className="flex flex-col items-stretch gap-3 md:items-end">
            <label
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-2xl bg-background/95 px-5 py-4 text-foreground shadow-lg transition-all",
                moi.disponible && "ring-4 ring-success/40"
              )}
            >
              <span className="relative flex size-3">
                {moi.disponible && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />}
                <span className={cn("relative inline-flex size-3 rounded-full", moi.disponible ? "bg-success" : "bg-muted-foreground")} />
              </span>
              <span>
                <span className="block text-sm font-bold">{moi.disponible ? "Disponible" : "En pause"}</span>
                <span className="block text-xs text-muted-foreground">
                  {moi.disponible ? "Vous recevez les demandes" : "Activez pour recevoir"}
                </span>
              </span>
              <Switch checked={moi.disponible} onCheckedChange={changerDisponibilite} aria-label="Disponibilité" />
            </label>
            <div className="flex gap-2 md:justify-end">
              <Button asChild size="sm" variant="secondary">
                <Link href="/accueil/demandes">Faire une demande pour moi</Link>
              </Button>
              <form action={deconnexion}>
                <Button size="sm" variant="secondary" type="submit" aria-label="Se déconnecter">
                  <LogOut />
                </Button>
              </form>
            </div>
          </div>
        }
      />

      {!valide && (
        <div className="flex animate-in fade-in items-start gap-3 rounded-2xl border border-accent/50 bg-accent/10 p-4 text-sm duration-700">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-accent-foreground dark:text-accent" />
          <p>
            <strong>Votre profil est en cours de validation.</strong> Vous pouvez déjà
            régler votre zone et vos services ; vous recevrez des demandes dès que
            notre équipe aura validé votre profil.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CarteStat icon={Inbox} label="À traiter" valeur={aTraiter.length} accent="accent" detail="Propositions en attente" />
        <CarteStat icon={PlayCircle} label="En cours" valeur={enCours.length} accent="primary" detail="Acceptées ou en route" delai={80} />
        <CarteStat icon={config.terminees.icon} label={config.terminees.label} valeur={terminees.length} accent="success" detail="Depuis le début" delai={160} />
        <CarteStat icon={TrendingUp} label="Cette semaine" valeur={semaine} accent="muted" detail="Depuis lundi" delai={240} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {(
              [
                { id: "a-traiter", label: "À traiter", n: aTraiter.length, icon: Hourglass },
                { id: "en-cours", label: "En cours", n: enCours.length, icon: PlayCircle },
                { id: "historique", label: "Historique", n: historique.length, icon: CheckCircle2 },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOnglet(o.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-300",
                  onglet === o.id ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <o.icon className="size-4" />
                <span className="hidden sm:inline">{o.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 text-xs tabular-nums",
                    o.id === "a-traiter" && o.n > 0 ? "animate-pulse bg-accent text-accent-foreground" : "bg-background"
                  )}
                >
                  {o.n}
                </span>
              </button>
            ))}
          </div>

          <div key={onglet} className="flex flex-col gap-3">
            {listes[onglet].length === 0 ? (
              <div className="flex animate-in fade-in flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center duration-500">
                <span className="relative flex size-16 items-center justify-center">
                  {onglet === "a-traiter" && moi.disponible && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  )}
                  <span className="relative flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <espace.icon className="size-7" />
                  </span>
                </span>
                <p className="font-semibold">
                  {onglet === "a-traiter"
                    ? moi.disponible
                      ? "En attente de demandes…"
                      : "Vous êtes en pause"
                    : onglet === "en-cours"
                      ? "Aucune demande en cours"
                      : "Pas encore d'historique"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {onglet === "a-traiter"
                    ? moi.disponible
                      ? "Dès qu'une personne proche aura besoin de vous, elle apparaîtra ici avec un son et une notification."
                      : "Activez « Disponible » en haut pour recevoir des demandes."
                    : "Les demandes apparaîtront ici au fur et à mesure."}
                </p>
              </div>
            ) : (
              listes[onglet].map((d, i) => (
                <CarteDemandeIntervenant key={d.id} demande={d} index={i} onRepondre={repondre} onAvancer={avancer} />
              ))
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <CarteLocalisation
            etat={loc.etat}
            aUnePosition={moi.lat != null}
            rayon={Number(moi.rayon_km)}
            onActiver={activerLocalisation}
            onRayon={(km) =>
              appeler({ p_rayon_km: km })
                .then(() => toast.success(`Rayon réglé sur ${km} km`))
                .catch((e) => toast.error(messageErreur(e)))
            }
          />
          {widget[moi.espace_slug]}
          <CarteServices services={donnees.services} onBasculer={basculerService} />
        </aside>
      </div>
    </main>
  )
}
