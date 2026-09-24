"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import {
  CheckCircle2,
  Hourglass,
  Inbox,
  PlayCircle,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { AlerteDemande } from "@/components/tableau/alerte-demande"
import { BarreTableau } from "@/components/tableau/barre-tableau"
import { CarteDemandeIntervenant } from "@/components/tableau/carte-demande-intervenant"
import { CarteLocalisation } from "@/components/tableau/carte-disponibilite"
import { CarteServices } from "@/components/tableau/carte-services"
import { CarteStat } from "@/components/tableau/carte-stat"
import { FenetreLocalisation, type LieuValide } from "@/components/tableau/fenetre-localisation"
import { EnTeteTableau, PastilleEnTete } from "@/components/tableau/en-tete-tableau"
import { WidgetBahourim } from "@/components/tableau/widgets/widget-bahourim"
import { WidgetEquipeFeminine } from "@/components/tableau/widgets/widget-equipe-feminine"
import { WidgetChaliah } from "@/components/tableau/widgets/widget-chaliah"
import { WidgetSofer } from "@/components/tableau/widgets/widget-sofer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { distanceMetres, useLocalisation } from "@/hooks/use-localisation"
import { useTempsReel } from "@/hooks/use-temps-reel"
import type { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import { ESPACES, libelleType } from "@/lib/espaces"
import { adresseDePosition } from "@/lib/tableau/adresses"
import {
  demanderPermissionNotifications,
  installerServiceWorker,
  jouerSon,
  notifierNouvelleDemande,
} from "@/lib/tableau/alertes"
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
    texte: "Téfilines, mezouza, boîtes de tsédaka, livres : les demandes des personnes proches vous sont proposées en direct.",
    terminees: { label: "Mitsvot accomplies", icon: Sparkles },
  },
  "equipe-feminine": {
    theme: "bg-gradient-to-br from-accent via-accent to-accent/70 text-accent-foreground",
    accroche: (p) => `Bonjour ${p}, prête à aider ?`,
    texte: "'Hallot, bougies et horaires de Chabbat, cours, préparation de Chabbat : recevez les demandes près de chez vous.",
    terminees: { label: "Visites réalisées", icon: Sparkles },
  },
  "sofer-rav-rabbanit": {
    theme: "bg-gradient-to-br from-success via-success to-success/75 text-success-foreground",
    accroche: (p) => `Bienvenue, ${p}`,
    texte: "Cacheroute, bérakhot, questions, accompagnement et mariages : gérez vos consultations et vos rendez-vous.",
    terminees: { label: "Consultations faites", icon: CheckCircle2 },
  },
  chaliah: {
    theme: "bg-gradient-to-br from-foreground via-foreground to-foreground/85 text-background",
    accroche: (p) => `Chalom ${p}`,
    texte: "Éducation juive, bar-mitsva, paracha, visites : suivez les personnes que vous guidez, à leur rythme.",
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
  // Demandes à afficher dans le message « Nouvelle demande » (les plus anciennes d'abord)
  const [alertes, setAlertes] = useState<string[]>(() =>
    initial.demandes.filter((d) => d.statut === "en_attente").map((d) => d.id).reverse()
  )

  const moi = donnees.intervenant!
  const espace = ESPACES.find((e) => e.slug === moi.espace_slug) ?? ESPACES[1]
  const config = CONFIG[moi.espace_slug] ?? CONFIG.bahourim
  const loc = useLocalisation({ suivre: moi.disponible })

  // Fenêtre de localisation : ouverte d'office tant qu'aucune position n'est enregistrée
  const [fenetre, setFenetre] = useState(initial.intervenant?.lat == null)
  const ouvertureAuto = useRef(initial.intervenant?.lat == null)
  useEffect(() => {
    if (moi.lat != null && ouvertureAuto.current) {
      ouvertureAuto.current = false
      setFenetre(false)
    }
  }, [moi.lat])

  // ---------- Chargement + alertes pour les nouvelles demandes ----------
  const charger = useCallback(async () => {
    const { data, error } = await supabase.rpc("tableau_intervenant")
    if (error || !data) return
    const d = data as unknown as DonneesIntervenant
    const nouvelles = d.demandes.filter((x) => x.statut === "en_attente" && !dejaVues.current.has(x.id))
    nouvelles.forEach((x) => {
      dejaVues.current.add(x.id)
      jouerSon()
      // Notification du système (utile quand l'onglet est en arrière-plan)
      if (document.visibilityState !== "visible") {
        notifierNouvelleDemande({
          id: x.id,
          service: x.service,
          nom: `${x.demandeur_prenom} ${x.demandeur_nom ?? ""}`.trim(),
          adresse: x.adresse,
          distance: formaterDistance(x.distance_m),
        })
      }
    })
    if (nouvelles.length) setAlertes((a) => [...a, ...nouvelles.map((x) => x.id)])
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
    adresseDePosition(p.lat, p.lng).then((adresse) =>
      appeler({ p_lat: p.lat, p_lng: p.lng, p_adresse: adresse ?? undefined }).catch(() => {})
    )
  }, [loc.position, appeler])

  const enregistrerLieu = async (lieu: LieuValide) => {
    dernierEnvoi.current = { lat: lieu.lat, lng: lieu.lng, t: Date.now() }
    await appeler({ p_lat: lieu.lat, p_lng: lieu.lng, p_adresse: lieu.adresse ?? undefined })
    toast.success("Position enregistrée", { description: lieu.adresse ?? "Votre zone est à jour." })
  }

  const changerDisponibilite = async (dispo: boolean) => {
    try {
      if (dispo && moi.lat == null && !loc.position) {
        toast("Indiquez d'abord où vous êtes", { description: "Votre position sert à vous proposer les demandes proches." })
        setFenetre(true)
        return
      }
      if (dispo) demanderPermissionNotifications()
      await appeler({ p_disponible: dispo })
      toast(dispo ? "Vous êtes disponible" : "Vous êtes en pause", {
        description: dispo
          ? "Les demandes proches vous seront proposées en direct."
          : "Vous ne recevrez plus de nouvelles demandes.",
      })
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  const repondre = useCallback(async (id: string, accepter: boolean) => {
    setAlertes((a) => a.filter((x) => x !== id))
    const { error } = await supabase.rpc("repondre_demande", { p_demande: id, p_accepter: accepter })
    if (error) toast.error(messageErreur(error))
    else {
      toast.success(accepter ? "Demande acceptée !" : "Demande refusée", {
        description: accepter
          ? "Le téléphone est maintenant affiché. Bonne mitsva !"
          : "Elle a été proposée à l'intervenant suivant.",
      })
      if (accepter) setOnglet("en-cours")
    }
    await charger()
  }, [supabase, charger])

  // Service worker + réponses données depuis la notification du système
  useEffect(() => {
    installerServiceWorker()
    const auMessage = (e: MessageEvent) => {
      const m = e.data as { type?: string; demande?: string; reponse?: string }
      if (m?.type !== "reponse-demande" || !m.demande) return
      if (m.reponse === "accepter") repondre(m.demande, true)
      else if (m.reponse === "refuser") repondre(m.demande, false)
      else setOnglet("a-traiter")
    }
    navigator.serviceWorker?.addEventListener("message", auMessage)

    // Page ouverte depuis la notification (?demande=…&reponse=…)
    const params = new URLSearchParams(window.location.search)
    const demande = params.get("demande")
    const reponse = params.get("reponse")
    if (demande && (reponse === "accepter" || reponse === "refuser")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- réponse unique venant de la notification
      repondre(demande, reponse === "accepter")
    }
    if (demande) window.history.replaceState(null, "", "/accueil")

    return () => navigator.serviceWorker?.removeEventListener("message", auMessage)
  }, [repondre])

  const avancer = async (id: string) => {
    const { data, error } = await supabase.rpc("avancer_demande", { p_demande: id })
    if (error) toast.error(messageErreur(error))
    else if (data === "terminee") toast.success("Mission terminée, bravo ! 🎉", { description: "Merci pour cette mitsva." })
    else toast("Bonne route !", { description: "La personne est prévenue que vous arrivez." })
    await charger()
  }

  /** Enregistre les services gardés (tous gardés = aucune restriction). */
  const changerServices = async (idsActifs: string[]) => {
    const tous = idsActifs.length === donnees.services.length
    const { error: e1 } = await supabase.from("intervenant_services").delete().eq("intervenant_id", utilisateurId)
    const { error: e2 } = tous
      ? { error: null }
      : await supabase
          .from("intervenant_services")
          .insert(idsActifs.map((id) => ({ intervenant_id: utilisateurId, service_id: id })))
    if (e1 || e2) toast.error(messageErreur(e1 ?? e2))
    else toast.success("Services mis à jour")
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
    "equipe-feminine": <WidgetEquipeFeminine demandes={demandes} />,
    "sofer-rav-rabbanit": <WidgetSofer demandes={demandes} />,
    chaliah: <WidgetChaliah demandes={demandes} />,
  }

  const interrupteur = (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-full border bg-card py-1.5 pr-2 pl-4 shadow-sm transition-all duration-500",
        moi.disponible && "border-success/50 shadow-md shadow-success/15 ring-4 ring-success/15"
      )}
    >
      <span className="relative flex size-2.5">
        {moi.disponible && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />}
        <span className={cn("relative inline-flex size-2.5 rounded-full", moi.disponible ? "bg-success" : "bg-muted-foreground")} />
      </span>
      <span className="text-sm font-semibold">{moi.disponible ? "Disponible" : "En pause"}</span>
      <Switch checked={moi.disponible} onCheckedChange={changerDisponibilite} aria-label="Disponibilité" />
    </label>
  )

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6">
      <FenetreLocalisation
        ouverte={fenetre}
        onFermer={() => setFenetre(false)}
        activerGps={loc.activer}
        onValider={enregistrerLieu}
        texte="Pour recevoir les demandes des personnes proches de vous, Mivtsa Now a besoin de savoir où vous êtes."
      />

      {(() => {
        const enAttente = alertes
          .map((id) => donnees.demandes.find((x) => x.id === id && x.statut === "en_attente"))
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
        return enAttente[0] && !fenetre ? (
          <AlerteDemande
            demande={enAttente[0]}
            restantes={enAttente.length - 1}
            onRepondre={repondre}
            onFermer={() => setAlertes((a) => a.filter((x) => x !== enAttente[0].id))}
          />
        ) : null
      })()}

      <BarreTableau icon={espace.icon} espace={`Espace ${espace.nom}`}>
        {interrupteur}
        <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
          <Link href="/accueil/demandes">Faire une demande pour moi</Link>
        </Button>
      </BarreTableau>

      <EnTeteTableau
        icon={espace.icon}
        theme={config.theme}
        surtitre={`Espace ${espace.nom}`}
        titre={config.accroche(prenom)}
        texte={
          moi.disponible
            ? config.texte
            : "Vous êtes en pause. Activez « Disponible » en haut à droite pour recevoir les demandes proches de vous."
        }
        badges={
          <>
            <PastilleEnTete>{libelleType(moi.type)}</PastilleEnTete>
            <PastilleEnTete>{moi.disponible ? "● En activité" : "❚❚ En pause"}</PastilleEnTete>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CarteStat icon={Inbox} label="À traiter" valeur={aTraiter.length} accent="accent" detail="Propositions en attente" />
        <CarteStat icon={PlayCircle} label="En cours" valeur={enCours.length} accent="primary" detail="Acceptées ou en route" delai={80} />
        <CarteStat icon={config.terminees.icon} label={config.terminees.label} valeur={terminees.length} accent="success" detail="Depuis le début" delai={160} />
        <CarteStat icon={TrendingUp} label="Cette semaine" valeur={semaine} accent="muted" detail="Depuis lundi" delai={240} />
      </div>

      {/* Ligne 1 : les demandes + la zone d'intervention */}
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

          <div key={onglet} className="flex flex-1 flex-col gap-3">
            {listes[onglet].length === 0 ? (
              <div className="flex flex-1 animate-in fade-in flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center duration-500">
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
                      : "Activez « Disponible » en haut à droite pour recevoir des demandes."
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

        <CarteLocalisation
          etat={loc.etat}
          adresse={moi.adresse}
          aUnePosition={moi.lat != null}
          rayon={Number(moi.rayon_km)}
          onModifier={() => setFenetre(true)}
          onRayon={(km) =>
            appeler({ p_rayon_km: km })
              .then(() => toast.success(`Rayon réglé sur ${km} km`))
              .catch((e) => toast.error(messageErreur(e)))
          }
        />
      </div>

      {/* Ligne 2 : les outils de l'espace + les services, cartes de même hauteur */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {widget[moi.espace_slug]}
        <CarteServices services={donnees.services} onChanger={changerServices} />
      </div>
    </main>
  )
}
