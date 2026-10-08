"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  HandHeart,
  Hourglass,
  Inbox,
  PlayCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import { BarreTableau } from "@/components/tableau/barre-tableau"
import { CarteAvis } from "@/components/tableau/carte-avis"
import { CarteDemandeIntervenant } from "@/components/tableau/carte-demande-intervenant"
import { CarteLocalisation } from "@/components/tableau/carte-disponibilite"
import { BandeauNotifications } from "@/components/tableau/carte-notifications"
import { CarteServices } from "@/components/tableau/carte-services"
import { CarteStat } from "@/components/tableau/carte-stat"
import { ResumeNote } from "@/components/tableau/etoiles"
import { FenetreAcceptation } from "@/components/tableau/fenetre-acceptation"
import { FenetreAnnulation } from "@/components/tableau/fenetre-annulation"
import { FenetreLocalisation, type LieuValide } from "@/components/tableau/fenetre-localisation"
import { EnTeteTableau, PastilleEnTete } from "@/components/tableau/en-tete-tableau"
import { MessagesDemandes, type MessageDemande } from "@/components/tableau/messages-demandes"
import { WidgetBahourim } from "@/components/tableau/widgets/widget-bahourim"
import { WidgetEquipeFeminine } from "@/components/tableau/widgets/widget-equipe-feminine"
import { WidgetChaliah } from "@/components/tableau/widgets/widget-chaliah"
import { WidgetSofer } from "@/components/tableau/widgets/widget-sofer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { distanceMetres, useLocalisation } from "@/hooks/use-localisation"
import { usePush } from "@/hooks/use-push"
import { useTempsReel } from "@/hooks/use-temps-reel"
import type { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import { ESPACES, libelleType } from "@/lib/espaces"
import { formaterDistance, nomService } from "@/lib/i18n"
import { adresseDePosition } from "@/lib/tableau/adresses"
import {
  demanderPermissionNotifications,
  installerServiceWorker,
  jouerSon,
  notifierNouvelleDemande,
} from "@/lib/tableau/alertes"
import { messageErreur } from "@/lib/tableau/outils"
import type { DemandeIntervenant, DonneesIntervenant, Transport } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

/** Couleurs et icône de chaque espace (les textes sont dans les dictionnaires). */
const THEMES: Record<string, { theme: string; icone: LucideIcon }> = {
  bahourim: { theme: "bg-gradient-to-br from-primary via-primary to-primary/75 text-primary-foreground", icone: Sparkles },
  "equipe-feminine": { theme: "bg-gradient-to-br from-accent via-accent to-accent/70 text-accent-foreground", icone: Sparkles },
  "sofer-rav-rabbanit": { theme: "bg-gradient-to-br from-success via-success to-success/75 text-success-foreground", icone: CheckCircle2 },
  chaliah: { theme: "bg-gradient-to-br from-foreground via-foreground to-foreground/85 text-background", icone: CheckCircle2 },
}

type Onglet = "a-traiter" | "en-cours" | "programmees" | "historique"
type Config = (typeof THEMES)[string]

export function TableauIntervenant({
  utilisateurId,
  prenom,
  initial,
}: {
  utilisateurId: string
  prenom: string
  initial: DonneesIntervenant
}) {
  const t = useT()
  const ti = t.intervenant
  const langue = useLangue()
  const [donnees, setDonnees] = useState(initial)
  const [onglet, setOnglet] = useState<Onglet>("a-traiter")
  const [acceptation, setAcceptation] = useState<DemandeIntervenant | null>(null)
  const [annulation, setAnnulation] = useState<DemandeIntervenant | null>(null)
  const supabase = useRef(createClient()).current

  // Ce que l'on connaissait déjà, pour repérer ce qui change
  const dejaVues = useRef(new Set(initial.demandes.filter((d) => d.statut === "en_attente").map((d) => d.id)))
  const etats = useRef(new Map(initial.demandes.map((d) => [d.id, { statut: d.statut, confirmee: d.confirmee }])))
  const nbAvis = useRef(initial.avis?.nombre ?? 0)
  // Demande à ouvrir dans « Accepter » (bouton de la notification)
  const aAccepter = useRef<string | null>(null)

  const moi = donnees.intervenant!
  const espace = ESPACES.find((e) => e.slug === moi.espace_slug) ?? ESPACES[1]
  const textesEspace = ti.config[moi.espace_slug as keyof typeof ti.config] ?? ti.config.bahourim
  const config: Config = THEMES[moi.espace_slug] ?? THEMES.bahourim
  const nomEspace = t.espaces[espace.slug].nom
  const loc = useLocalisation({ suivre: moi.disponible })
  const push = usePush()

  // Fenêtre de localisation : ouverte d'office tant qu'aucune position n'est enregistrée
  const [fenetre, setFenetre] = useState(initial.intervenant?.lat == null)
  const ouvertureAuto = useRef(initial.intervenant?.lat == null)
  useEffect(() => {
    if (moi.lat != null && ouvertureAuto.current) {
      ouvertureAuto.current = false
      setFenetre(false)
    }
  }, [moi.lat])

  // ---------- Chargement + ce qui a changé ----------
  const charger = useCallback(async () => {
    const { data, error } = await supabase.rpc("tableau_intervenant")
    if (error || !data) return
    const d = data as unknown as DonneesIntervenant

    d.demandes.forEach((x) => {
      const service = nomService(x.service_noms, x.service, langue)
      // Nouvelle demande : un son (et une notification si la page est cachée)
      if (x.statut === "en_attente" && !dejaVues.current.has(x.id)) {
        dejaVues.current.add(x.id)
        jouerSon()
        if (document.visibilityState !== "visible") {
          notifierNouvelleDemande({
            id: x.id,
            titre: `${ti.toasts.nouvelleDemande} : ${service}`,
            corps: `${x.demandeur_prenom} ${x.demandeur_nom ?? ""}\n📍 ${x.adresse ?? ""} (${formaterDistance(x.distance_m, langue)})`,
            boutons: { accepter: `✅ ${ti.carte.accepter}`, refuser: ti.carte.pasDispo },
          })
        }
      }
      const avant = etats.current.get(x.id)
      if (avant) {
        // Le demandeur a annulé
        if (avant.statut !== "annulee" && x.statut === "annulee" && x.annulee_par === "demandeur") {
          jouerSon()
          toast.error(t.messages.annuleeParDemandeur(x.demandeur_prenom, service), {
            description: x.motif_annulation ? `${t.tableau.motif} : ${x.motif_annulation}` : undefined,
            duration: 12000,
          })
        }
        // Le demandeur a confirmé : on peut y aller
        if (x.statut === "acceptee" && !avant.confirmee && x.confirmee) {
          jouerSon()
          toast.success(ti.toasts.confirmee(x.demandeur_prenom), { description: service, duration: 10000 })
        }
      }
      etats.current.set(x.id, { statut: x.statut, confirmee: x.confirmee })
    })

    // Nouvel avis
    if ((d.avis?.nombre ?? 0) > nbAvis.current && d.avis.liste[0]) {
      toast.success(ti.toasts.avis(d.avis.liste[0].prenom), { icon: <BellRing className="size-4" /> })
    }
    nbAvis.current = d.avis?.nombre ?? 0
    setDonnees(d)
  }, [supabase, langue, t, ti])

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
    adresseDePosition(p.lat, p.lng, langue).then((adresse) =>
      appeler({ p_lat: p.lat, p_lng: p.lng, p_adresse: adresse ?? undefined }).catch(() => {})
    )
  }, [loc.position, appeler, langue])

  const enregistrerLieu = async (lieu: LieuValide) => {
    dernierEnvoi.current = { lat: lieu.lat, lng: lieu.lng, t: Date.now() }
    await appeler({ p_lat: lieu.lat, p_lng: lieu.lng, p_adresse: lieu.adresse ?? undefined })
    toast.success(ti.toasts.positionEnregistree, { description: lieu.adresse ?? ti.toasts.zoneAJour })
  }

  const changerDisponibilite = async (dispo: boolean) => {
    try {
      if (dispo && moi.lat == null && !loc.position) {
        toast(ti.toasts.indiquezDabord, { description: ti.toasts.indiquezTexte })
        setFenetre(true)
        return
      }
      // Profite du clic pour activer les notifications sur ce téléphone
      if (dispo && push.etat === "inactif") push.activer(true)
      else if (dispo) demanderPermissionNotifications()
      await appeler({ p_disponible: dispo })
      toast(dispo ? ti.toasts.dispo : ti.toasts.pause, {
        description: dispo ? ti.toasts.dispoTexte : ti.toasts.pauseTexte,
      })
    } catch (e) {
      toast.error(messageErreur(e, t))
    }
  }

  /** Refuser (« Pas disponible ») : la demande passe au suivant. */
  const refuser = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc("repondre_demande", { p_demande: id, p_accepter: false })
      if (error) toast.error(messageErreur(error, t))
      else toast(ti.toasts.refusee, { description: ti.toasts.refuseeTexte })
      await charger()
    },
    [supabase, charger, t, ti]
  )

  /** Accepter, avec le moyen de transport et le délai d'arrivée. */
  const accepter = async (id: string, transport: Transport, eta: number | null) => {
    const { error } = await supabase.rpc("repondre_demande", {
      p_demande: id,
      p_accepter: true,
      p_transport: transport,
      p_eta_minutes: eta ?? undefined,
    })
    if (error) {
      toast.error(messageErreur(error, t))
      await charger()
      return false
    }
    toast.success(ti.toasts.acceptee, { description: ti.toasts.accepteeTexte })
    const d = donnees.demandes.find((x) => x.id === id)
    setOnglet(d?.programmee_pour ? "programmees" : "en-cours")
    await charger()
    return true
  }

  // Ouvre « Accepter » pour une demande (dès qu'elle est chargée)
  const ouvrirAcceptation = useCallback(
    (id: string) => {
      const d = donnees.demandes.find((x) => x.id === id && x.statut === "en_attente")
      if (d) {
        aAccepter.current = null
        setOnglet("a-traiter")
        setAcceptation(d)
      } else {
        aAccepter.current = id
        charger()
      }
    },
    [donnees.demandes, charger]
  )
  useEffect(() => {
    const id = aAccepter.current
    if (!id) return
    const d = donnees.demandes.find((x) => x.id === id && x.statut === "en_attente")
    if (d) {
      aAccepter.current = null
      setOnglet("a-traiter")
      setAcceptation(d)
    }
  }, [donnees.demandes])

  // Service worker + réponses données depuis la notification du système
  useEffect(() => {
    installerServiceWorker()
    const auMessage = (e: MessageEvent) => {
      const m = e.data as { type?: string; demande?: string; reponse?: string }
      if (m?.type !== "reponse-demande" || !m.demande) return
      if (m.reponse === "accepter") ouvrirAcceptation(m.demande)
      else if (m.reponse === "refuser") refuser(m.demande)
      else setOnglet("a-traiter")
    }
    navigator.serviceWorker?.addEventListener("message", auMessage)
    return () => navigator.serviceWorker?.removeEventListener("message", auMessage)
  }, [ouvrirAcceptation, refuser])

  // Page ouverte depuis la notification (?demande=…&reponse=…)
  const lienTraite = useRef(false)
  useEffect(() => {
    if (lienTraite.current) return
    lienTraite.current = true
    const params = new URLSearchParams(window.location.search)
    const demande = params.get("demande")
    const reponse = params.get("reponse")
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réponse unique venant de la notification
    if (demande && reponse === "accepter") ouvrirAcceptation(demande)
    else if (demande && reponse === "refuser") refuser(demande)
    if (demande) window.history.replaceState(null, "", "/accueil")
  }, [ouvrirAcceptation, refuser])

  const avancer = async (id: string) => {
    const { data, error } = await supabase.rpc("avancer_demande", { p_demande: id })
    if (error) toast.error(messageErreur(error, t))
    else if (data === "terminee") toast.success(ti.toasts.terminee, { description: ti.toasts.merci })
    else {
      toast(ti.toasts.bonneRoute, { description: ti.toasts.prevenu })
      setOnglet("en-cours")
    }
    await charger()
  }

  const annulerIntervention = async (motif: string) => {
    if (!annulation) return false
    const { error } = await supabase.rpc("annuler_intervention", { p_demande: annulation.id, p_motif: motif })
    if (error) {
      toast.error(messageErreur(error, t))
      return false
    }
    toast(ti.toasts.annulee, { description: ti.toasts.annuleeTexte })
    await charger()
    return true
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
    if (e1 || e2) toast.error(messageErreur(e1 ?? e2, t))
    else toast.success(ti.toasts.servicesAJour)
    await charger()
  }

  // ---------- Listes et chiffres ----------
  const demandes = donnees.demandes
  const aTraiter = demandes.filter((d) => d.statut === "en_attente")
  const programmees = demandes
    .filter((d) => d.statut === "acceptee" && d.programmee_pour)
    .sort((a, b) => a.programmee_pour!.localeCompare(b.programmee_pour!))
  const enCours = demandes.filter((d) => d.statut === "en_cours" || (d.statut === "acceptee" && !d.programmee_pour))
  // Les demandes annulées ou expirées disparaissent des listes
  const historique = demandes.filter((d) => d.statut === "terminee")
  const listes: Record<Onglet, DemandeIntervenant[]> = {
    "a-traiter": aTraiter,
    "en-cours": enCours,
    programmees,
    historique,
  }

  const messages: MessageDemande[] = demandes
    .filter((d) => d.statut === "annulee" && d.annulee_par === "demandeur")
    .map((d) => ({
      id: `annulee-${d.id}`,
      date: d.updated_at,
      titre: t.messages.annuleeParDemandeur(d.demandeur_prenom, nomService(d.service_noms, d.service, langue)),
      motif: d.motif_annulation,
      ton: "annulee",
    }))

  const widget: Record<string, ReactNode> = {
    bahourim: <WidgetBahourim demandes={demandes} />,
    "equipe-feminine": <WidgetEquipeFeminine demandes={demandes} />,
    "sofer-rav-rabbanit": <WidgetSofer demandes={demandes} />,
    chaliah: <WidgetChaliah demandes={demandes} />,
  }

  const interrupteur = (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-full border bg-card py-1.5 ps-4 pe-2 shadow-sm transition-all duration-500",
        moi.disponible && "border-success/50 shadow-md shadow-success/15 ring-4 ring-success/15"
      )}
    >
      <span className="relative flex size-2.5">
        {moi.disponible && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />}
        <span className={cn("relative inline-flex size-2.5 rounded-full", moi.disponible ? "bg-success" : "bg-muted-foreground")} />
      </span>
      <span className="text-sm font-semibold">{moi.disponible ? ti.disponible : ti.enPause}</span>
      <Switch checked={moi.disponible} onCheckedChange={changerDisponibilite} aria-label={ti.disponibilite} />
    </label>
  )

  const vide: Record<Onglet, { titre: string; texte: string }> = {
    "a-traiter": moi.disponible
      ? { titre: ti.vide.attente, texte: ti.vide.attenteTexte }
      : { titre: ti.vide.pause, texte: ti.vide.pauseTexte },
    "en-cours": { titre: ti.vide.enCours, texte: ti.vide.auFur },
    programmees: { titre: ti.vide.programmees, texte: ti.vide.programmeesTexte },
    historique: { titre: ti.vide.historique, texte: ti.vide.auFur },
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6">
      <FenetreLocalisation
        ouverte={fenetre}
        onFermer={() => setFenetre(false)}
        activerGps={loc.activer}
        onValider={enregistrerLieu}
        texte={ti.locTexte}
      />
      <FenetreAcceptation demande={acceptation} onFermer={() => setAcceptation(null)} onValider={accepter} />
      <FenetreAnnulation
        ouverte={annulation != null}
        cote="intervenant"
        service={annulation ? nomService(annulation.service_noms, annulation.service, langue) : ""}
        onFermer={() => setAnnulation(null)}
        onValider={annulerIntervention}
      />

      <BarreTableau icon={espace.icon} espace={t.tableau.espace(nomEspace)}>
        {interrupteur}
      </BarreTableau>

      <EnTeteTableau
        icon={espace.icon}
        theme={config.theme}
        surtitre={t.tableau.espace(nomEspace)}
        titre={textesEspace.accroche(prenom)}
        texte={moi.disponible ? textesEspace.texte : ti.pauseTexte}
        badges={
          <>
            <PastilleEnTete>{libelleType(moi.type, t)}</PastilleEnTete>
            <PastilleEnTete>{moi.disponible ? ti.enActivite : ti.pauseBadge}</PastilleEnTete>
            <PastilleEnTete>
              <ResumeNote moyenne={donnees.avis?.moyenne ?? null} nombre={donnees.avis?.nombre ?? 0} variante="bandeau" />
            </PastilleEnTete>
          </>
        }
        droite={
          <Button
            asChild
            size="lg"
            className="w-full bg-background text-foreground shadow-lg hover:bg-background/90 md:w-auto"
          >
            <Link href="/accueil/demandes">
              <HandHeart /> {t.tableau.faireDemandePourMoi}
            </Link>
          </Button>
        }
      />

      <BandeauNotifications etat={push.etat} onActiver={() => push.activer()} onTester={push.tester} texte={ti.notifTexte} />

      <MessagesDemandes messages={messages} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CarteStat icon={Inbox} label={ti.stats.aTraiter} valeur={aTraiter.length} accent="accent" detail={ti.stats.aTraiterDetail} />
        <CarteStat icon={PlayCircle} label={ti.stats.enCours} valeur={enCours.length} accent="primary" detail={ti.stats.enCoursDetail} delai={80} />
        <CarteStat icon={CalendarClock} label={ti.stats.programmees} valeur={programmees.length} accent="muted" detail={ti.stats.programmeesDetail} delai={160} />
        <CarteStat icon={config.icone} label={textesEspace.terminees} valeur={historique.length} accent="success" detail={ti.stats.depuisDebut} delai={240} />
      </div>

      {/* Ligne 1 : les demandes + la zone d'intervention */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {(
              [
                { id: "a-traiter", label: ti.onglets.aTraiter, n: aTraiter.length, icon: Hourglass },
                { id: "en-cours", label: ti.onglets.enCours, n: enCours.length, icon: PlayCircle },
                { id: "programmees", label: ti.onglets.programmees, n: programmees.length, icon: CalendarClock },
                { id: "historique", label: ti.onglets.historique, n: historique.length, icon: CheckCircle2 },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOnglet(o.id)}
                aria-label={o.label}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-semibold transition-all duration-300",
                  onglet === o.id ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <o.icon className="size-4 shrink-0" />
                <span className="hidden truncate sm:inline">{o.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 text-xs tabular-nums",
                    o.id === "a-traiter" && o.n > 0 ? "animate-pulse bg-primary text-primary-foreground" : "bg-background"
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
                    {onglet === "programmees" ? <CalendarClock className="size-7" /> : <espace.icon className="size-7" />}
                  </span>
                </span>
                <p className="font-semibold">{vide[onglet].titre}</p>
                <p className="max-w-sm text-sm text-muted-foreground">{vide[onglet].texte}</p>
              </div>
            ) : (
              listes[onglet].map((d, i) => (
                <CarteDemandeIntervenant
                  key={d.id}
                  demande={d}
                  index={i}
                  onAccepter={setAcceptation}
                  onRefuser={refuser}
                  onAvancer={avancer}
                  onAnnuler={setAnnulation}
                />
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
              .then(() => toast.success(ti.toasts.rayon(km)))
              .catch((e) => toast.error(messageErreur(e, t)))
          }
        />
      </div>

      {/* Ligne 2 : les outils de l'espace + mes avis */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {widget[moi.espace_slug]}
        <CarteAvis
          avis={donnees.avis ?? { moyenne: null, nombre: 0, liste: [] }}
          className="md:col-span-2 lg:col-span-1"
        />
      </div>

      {/* Ligne 3 : les services proposés */}
      <CarteServices services={donnees.services} onChanger={changerServices} />
    </main>
  )
}
