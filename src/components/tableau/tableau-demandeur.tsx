"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { BellRing, CheckCircle2, History, Lightbulb, PlayCircle, Plus, Sparkles } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import { BarreTableau } from "@/components/tableau/barre-tableau"
import { BandeauNotifications } from "@/components/tableau/carte-notifications"
import { CarteStat } from "@/components/tableau/carte-stat"
import { CatalogueServices } from "@/components/tableau/catalogue-services"
import { FenetreAnnulation } from "@/components/tableau/fenetre-annulation"
import { FenetreLocalisation, type LieuValide } from "@/components/tableau/fenetre-localisation"
import { EnTeteTableau, PastilleEnTete } from "@/components/tableau/en-tete-tableau"
import { FormulaireDemande, type ServiceDisponible } from "@/components/tableau/formulaire-demande"
import { HistoriqueDemandes } from "@/components/tableau/historique-demandes"
import { MessagesDemandes, type MessageDemande } from "@/components/tableau/messages-demandes"
import { SuiviDemande } from "@/components/tableau/suivi-demande"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { Button } from "@/components/ui/button"
import { useLocalisation } from "@/hooks/use-localisation"
import { usePush } from "@/hooks/use-push"
import { useTempsReel } from "@/hooks/use-temps-reel"
import { createClient } from "@/lib/supabase/client"
import { ESPACES } from "@/lib/espaces"
import { formaterDateHeure, nomService } from "@/lib/i18n"
import { demanderPermissionNotifications, jouerSon, notifierNavigateur } from "@/lib/tableau/alertes"
import { messageErreur } from "@/lib/tableau/outils"
import { adresseDePosition } from "@/lib/tableau/adresses"
import type { DemandeDemandeur, PositionEnregistree } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

const ACTIVES = ["en_attente", "acceptee", "en_cours"]

export function TableauDemandeur({
  utilisateurId,
  prenom,
  initial,
  services,
  positionInitiale,
  telephone,
  estIntervenant = false,
}: {
  utilisateurId: string
  prenom: string
  initial: DemandeDemandeur[]
  services: ServiceDisponible[]
  positionInitiale: PositionEnregistree
  /** Numéro du compte, proposé par défaut dans le formulaire */
  telephone: string
  estIntervenant?: boolean
}) {
  const t = useT()
  const td = t.demandeur
  const langue = useLangue()
  const [demandes, setDemandes] = useState(initial)
  const [annulation, setAnnulation] = useState<DemandeDemandeur | null>(null)
  const supabase = useRef(createClient()).current
  const statuts = useRef(new Map(initial.map((d) => [d.id, d.statut])))
  const loc = useLocalisation()
  const push = usePush()
  const espace = ESPACES[0]

  // Position enregistrée dans le profil (sert pour les demandes)
  const [lieu, setLieu] = useState<LieuValide | null>(positionInitiale)
  const [fenetre, setFenetre] = useState(positionInitiale == null)
  const [preselection, setPreselection] = useState<{ espace: string; service: string; n: number } | null>(null)

  const enregistrerLieu = useCallback(
    async (l: LieuValide) => {
      const { error } = await supabase.rpc("enregistrer_ma_position", {
        p_lat: l.lat,
        p_lng: l.lng,
        p_adresse: l.adresse ?? undefined,
      })
      if (error) {
        toast.error(messageErreur(error, t))
        throw error
      }
      setLieu(l)
    },
    [supabase, t]
  )

  // Localisation déjà autorisée : on met à jour la position et l'adresse en silence
  const dejaMiseAJour = useRef(false)
  useEffect(() => {
    const p = loc.position
    if (!p || dejaMiseAJour.current) return
    dejaMiseAJour.current = true
    adresseDePosition(p.lat, p.lng, langue).then((adresse) => {
      enregistrerLieu({ lat: p.lat, lng: p.lng, adresse }).then(() => setFenetre(false)).catch(() => {})
    })
  }, [loc.position, enregistrerLieu, langue])

  const charger = useCallback(async () => {
    const { data, error } = await supabase.rpc("tableau_demandeur")
    if (error || !data) return
    const liste = (data as unknown as { demandes: DemandeDemandeur[] }).demandes
    // Alerte quand le statut d'une demande change
    liste.forEach((d) => {
      const avant = statuts.current.get(d.id)
      if (avant && avant !== d.statut) {
        const service = nomService(d.service_noms, d.service, langue)
        const qui = d.intervenant_prenom ?? t.types.defaut
        let texte: string | null = null
        if (d.statut === "acceptee") {
          texte = td.toasts.acceptee(qui)
          toast.success(texte, { description: td.toasts.accepteeTexte, icon: <BellRing className="size-4" />, duration: 10000 })
        } else if (d.statut === "en_cours") {
          texte = td.toasts.enRoute(qui)
          toast.success(texte, { description: service, icon: <BellRing className="size-4" /> })
        } else if (d.statut === "terminee") {
          texte = td.toasts.terminee
          toast.success(texte, { description: service })
        } else if (d.statut === "annulee" && d.annulee_par === "intervenant") {
          texte = td.toasts.annuleeParIntervenant(qui)
          toast.error(texte, {
            description: d.motif_annulation ? `${t.tableau.motif} : ${d.motif_annulation}` : service,
            duration: 12000,
          })
        } else if (d.statut === "en_attente" && d.annulee_par === "intervenant") {
          // L'intervenant a annulé : la demande repart chez tous les intervenants proches
          texte = td.toasts.relance
          toast(texte, {
            description: d.motif_annulation
              ? `${t.tableau.motif} : ${d.motif_annulation} — ${td.toasts.relanceTexte}`
              : td.toasts.relanceTexte,
            icon: <BellRing className="size-4" />,
            duration: 12000,
          })
        } else if (d.statut === "expiree") {
          texte = td.toasts.expiree
          toast.error(texte, { description: service, duration: 12000 })
        }
        if (texte) {
          jouerSon()
          notifierNavigateur("Mivtsa Now", texte)
        }
      }
      statuts.current.set(d.id, d.statut)
    })
    setDemandes(liste)
  }, [supabase, langue, t, td])

  useTempsReel("demandeur_id", utilisateurId, charger)

  const envoyer = async (f: {
    service: string
    lat: number
    lng: number
    adresse: string | null
    telephone: string
    message: string
    programmeePour: string | null
  }) => {
    const { error } = await supabase.rpc("creer_demande", {
      p_service: f.service,
      p_lat: f.lat,
      p_lng: f.lng,
      p_telephone: f.telephone,
      p_adresse: f.adresse ?? undefined,
      p_message: f.message || undefined,
      p_programmee_pour: f.programmeePour ?? undefined,
    })
    if (error) {
      toast.error(messageErreur(error, t))
      return false
    }
    demanderPermissionNotifications()
    if (f.programmeePour)
      toast.success(td.toasts.programmee, { description: td.toasts.programmeeTexte(formaterDateHeure(f.programmeePour, langue)) })
    else toast.success(td.toasts.envoyee, { description: td.toasts.recherche })
    await charger()
    document.getElementById("suivi")?.scrollIntoView({ behavior: "smooth" })
    return true
  }

  const annuler = async (motif: string) => {
    if (!annulation) return false
    const { error } = await supabase.rpc("annuler_demande", { p_demande: annulation.id, p_motif: motif })
    if (error) {
      toast.error(messageErreur(error, t))
      await charger()
      return false
    }
    toast(td.toasts.annulee, { description: annulation.intervenant_trouve ? td.toasts.annuleeTexte : undefined })
    await charger()
    return true
  }

  const confirmer = async (id: string, oui: boolean) => {
    const d = demandes.find((x) => x.id === id)
    const { error } = await supabase.rpc("confirmer_intervenant", { p_demande: id, p_confirmer: oui })
    if (error) toast.error(messageErreur(error, t))
    else if (oui) toast.success(td.toasts.confirme, { description: td.toasts.confirmeTexte(d?.intervenant_prenom ?? "") })
    else toast(td.toasts.autreRecherche)
    await charger()
  }

  const noter = async (id: string, note: number, commentaire: string) => {
    const { error } = await supabase.from("avis").insert({ demande_id: id, note, commentaire: commentaire || null })
    if (error) toast.error(messageErreur(error, t))
    else toast.success(t.avis.merci)
    await charger()
  }

  /** Prépare le formulaire avec un service (catalogue ou « Refaire la demande »). */
  const preparer = (espaceSlug: string, serviceId: string) => {
    setPreselection((p) => ({ espace: espaceSlug, service: serviceId, n: (p?.n ?? 0) + 1 }))
    document.getElementById("nouvelle")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // Les demandes à confirmer passent en premier
  const actives = demandes
    .filter((d) => ACTIVES.includes(d.statut))
    .sort((a, b) => Number(b.statut === "acceptee" && !b.confirmee) - Number(a.statut === "acceptee" && !a.confirmee))
  // Les demandes annulées ou expirées disparaissent des listes (un message les signale)
  const passees = demandes.filter((d) => d.statut === "terminee")
  const terminees = passees.length

  const messages: MessageDemande[] = demandes
    .filter((d) => d.statut === "expiree" || (d.statut === "annulee" && d.annulee_par === "intervenant"))
    .map((d) => {
      const service = nomService(d.service_noms, d.service, langue)
      const idService = services.find((s) => s.espace_slug === d.espace_slug && s.nom === d.service)?.id
      const refaire = idService ? () => preparer(d.espace_slug, idService) : undefined
      return d.statut === "expiree"
        ? { id: `expiree-${d.id}`, date: d.updated_at, titre: t.messages.expiree(service), texte: t.messages.expireeTexte, ton: "expiree" as const, refaire }
        : {
            id: `annulee-${d.id}`,
            date: d.updated_at,
            titre: t.messages.annuleeParIntervenant(d.intervenant_prenom ?? t.types.defaut, service),
            motif: d.motif_annulation,
            ton: "annulee" as const,
            refaire,
          }
    })

  const titreEspace = estIntervenant ? t.tableau.mesDemandesPerso : t.tableau.espace(t.espaces.demandeurs.nom)

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6">
      <FenetreLocalisation
        ouverte={fenetre}
        onFermer={() => setFenetre(false)}
        activerGps={loc.activer}
        onValider={async (l) => {
          dejaMiseAJour.current = true
          await enregistrerLieu(l)
          toast.success(t.localisation.positionEnregistree, { description: l.adresse ?? undefined })
        }}
        texte={td.locTexte}
      />
      <FenetreAnnulation
        ouverte={annulation != null}
        cote="demandeur"
        service={annulation ? nomService(annulation.service_noms, annulation.service, langue) : ""}
        onFermer={() => setAnnulation(null)}
        onValider={annuler}
      />

      <BarreTableau icon={espace.icon} espace={titreEspace}>
        {estIntervenant && (
          <Button asChild size="sm" variant="outline">
            <Link href="/accueil">{t.tableau.monTableau}</Link>
          </Button>
        )}
      </BarreTableau>

      <EnTeteTableau
        icon={espace.icon}
        theme="bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground"
        surtitre={titreEspace}
        titre={td.titre(prenom)}
        texte={td.texte}
        badges={
          <>
            <PastilleEnTete>{td.gratuit}</PastilleEnTete>
            <PastilleEnTete>{td.suiviDirect}</PastilleEnTete>
          </>
        }
        droite={
          <Button asChild size="lg" className="bg-accent text-accent-foreground shadow-lg hover:bg-accent/90">
            <a href="#nouvelle">
              <Plus /> {td.nouvelle}
            </a>
          </Button>
        }
      />

      <BandeauNotifications etat={push.etat} onActiver={() => push.activer()} onTester={push.tester} texte={td.notifTexte} />

      <MessagesDemandes messages={messages} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CarteStat icon={PlayCircle} label={td.stats.enCours} valeur={actives.length} accent="primary" detail={td.stats.suivies} />
        <CarteStat icon={Sparkles} label={td.stats.accomplies} valeur={terminees} accent="success" detail={td.stats.grace} delai={80} />
        <CarteStat icon={History} label={td.stats.faites} valeur={demandes.length} accent="accent" detail={td.stats.depuisDebut} delai={160} />
        <CarteStat icon={CheckCircle2} label={td.stats.avisDonnes} valeur={demandes.filter((d) => d.note).length} accent="muted" detail={td.stats.merci} delai={240} />
      </div>

      {actives.length > 0 && (
        <section id="suivi" className="flex scroll-mt-24 flex-col gap-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            {td.suivi}
          </h2>
          <div className={cn("grid gap-4", actives.length > 1 && "xl:grid-cols-2")}>
            {actives.map((d) => (
              <SuiviDemande key={d.id} demande={d} onAnnuler={setAnnulation} onConfirmer={confirmer} />
            ))}
          </div>
        </section>
      )}

      <CatalogueServices services={services} onChoisir={preparer} />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section id="nouvelle" className="scroll-mt-24 lg:col-span-2">
          <CarteWidget icon={Plus} titre={td.nouvelle} sousTitre={td.etapes} delai={150}>
            <FormulaireDemande
              services={services}
              lieu={lieu}
              telephoneParDefaut={telephone}
              preselection={preselection}
              onModifierLieu={() => setFenetre(true)}
              onEnvoyer={envoyer}
            />
          </CarteWidget>
        </section>

        <aside className="flex flex-col gap-6">
          <CarteWidget icon={History} titre={td.historique} sousTitre={td.historiqueSous} delai={250}>
            <div className="max-h-[28rem] overflow-y-auto pe-1">
              <HistoriqueDemandes demandes={passees} onNoter={noter} />
            </div>
          </CarteWidget>
          <CarteWidget icon={Lightbulb} titre={td.bonASavoir} delai={350}>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {td.conseils.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </CarteWidget>
        </aside>
      </div>
    </main>
  )
}
