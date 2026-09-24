"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { BellRing, CheckCircle2, History, Lightbulb, PlayCircle, Plus, Sparkles } from "lucide-react"

import { BarreTableau } from "@/components/tableau/barre-tableau"
import { CarteStat } from "@/components/tableau/carte-stat"
import { CatalogueServices } from "@/components/tableau/catalogue-services"
import { FenetreLocalisation, type LieuValide } from "@/components/tableau/fenetre-localisation"
import { EnTeteTableau, PastilleEnTete } from "@/components/tableau/en-tete-tableau"
import { FormulaireDemande, type ServiceDisponible } from "@/components/tableau/formulaire-demande"
import { HistoriqueDemandes } from "@/components/tableau/historique-demandes"
import { SuiviDemande } from "@/components/tableau/suivi-demande"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { Button } from "@/components/ui/button"
import { useLocalisation } from "@/hooks/use-localisation"
import { useTempsReel } from "@/hooks/use-temps-reel"
import { createClient } from "@/lib/supabase/client"
import { ESPACES } from "@/lib/espaces"
import { demanderPermissionNotifications, jouerSon, notifierNavigateur } from "@/lib/tableau/alertes"
import { messageErreur } from "@/lib/tableau/outils"
import { adresseDePosition } from "@/lib/tableau/adresses"
import type { DemandeDemandeur, PositionEnregistree } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

const MESSAGES: Record<string, (d: DemandeDemandeur) => string> = {
  acceptee: (d) => `${d.intervenant_prenom ?? "Un intervenant"} a accepté votre demande !`,
  en_cours: (d) => `${d.intervenant_prenom ?? "L'intervenant"} est en route vers vous.`,
  terminee: () => "Demande terminée. Merci d'avoir fait appel à Mivtsa Now !",
}

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
  const [demandes, setDemandes] = useState(initial)
  const supabase = useRef(createClient()).current
  const statuts = useRef(new Map(initial.map((d) => [d.id, d.statut])))
  const loc = useLocalisation()
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
        toast.error(messageErreur(error))
        throw error
      }
      setLieu(l)
    },
    [supabase]
  )

  // Localisation déjà autorisée : on met à jour la position et l'adresse en silence
  const dejaMiseAJour = useRef(false)
  useEffect(() => {
    const p = loc.position
    if (!p || dejaMiseAJour.current) return
    dejaMiseAJour.current = true
    adresseDePosition(p.lat, p.lng).then((adresse) => {
      enregistrerLieu({ lat: p.lat, lng: p.lng, adresse }).then(() => setFenetre(false)).catch(() => {})
    })
  }, [loc.position, enregistrerLieu])

  const charger = useCallback(async () => {
    const { data, error } = await supabase.rpc("tableau_demandeur")
    if (error || !data) return
    const liste = (data as unknown as { demandes: DemandeDemandeur[] }).demandes
    // Alerte quand le statut d'une demande change
    liste.forEach((d) => {
      const avant = statuts.current.get(d.id)
      if (avant && avant !== d.statut && MESSAGES[d.statut]) {
        const texte = MESSAGES[d.statut](d)
        jouerSon()
        toast.success(texte, { description: d.service, icon: <BellRing className="size-4" /> })
        notifierNavigateur("Mivtsa Now", texte)
      }
      statuts.current.set(d.id, d.statut)
    })
    setDemandes(liste)
  }, [supabase])

  useTempsReel("demandeur_id", utilisateurId, charger)

  const envoyer = async (f: {
    service: string
    lat: number
    lng: number
    adresse: string | null
    telephone: string
    message: string
  }) => {
    const { error } = await supabase.rpc("creer_demande", {
      p_service: f.service,
      p_lat: f.lat,
      p_lng: f.lng,
      p_telephone: f.telephone,
      p_adresse: f.adresse ?? undefined,
      p_message: f.message || undefined,
    })
    if (error) {
      toast.error(messageErreur(error))
      return false
    }
    demanderPermissionNotifications()
    toast.success("Demande envoyée !", { description: "Nous cherchons l'intervenant le plus proche de vous." })
    await charger()
    document.getElementById("suivi")?.scrollIntoView({ behavior: "smooth" })
    return true
  }

  const annuler = async (id: string) => {
    const { error } = await supabase.rpc("annuler_demande", { p_demande: id })
    if (error) toast.error(messageErreur(error))
    else toast("Demande annulée")
    await charger()
  }

  const noter = async (id: string, note: number) => {
    const { error } = await supabase.from("avis").insert({ demande_id: id, note })
    if (error) toast.error(messageErreur(error))
    else toast.success("Merci pour votre avis !")
    await charger()
  }

  const actives = demandes.filter((d) => ["en_attente", "acceptee", "en_cours"].includes(d.statut))
  const passees = demandes.filter((d) => d.statut === "terminee" || d.statut === "annulee")
  const terminees = demandes.filter((d) => d.statut === "terminee").length

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6">
      <FenetreLocalisation
        ouverte={fenetre}
        onFermer={() => setFenetre(false)}
        activerGps={loc.activer}
        onValider={async (l) => {
          dejaMiseAJour.current = true
          await enregistrerLieu(l)
          toast.success("Position enregistrée", { description: l.adresse ?? undefined })
        }}
        texte="Pour trouver l'intervenant le plus proche de chez vous, Mivtsa Now a besoin de savoir où vous êtes."
      />

      <BarreTableau icon={espace.icon} espace={estIntervenant ? "Mes demandes personnelles" : "Espace Demandeurs"}>
        {estIntervenant && (
          <Button asChild size="sm" variant="outline">
            <Link href="/accueil">Mon tableau de bord</Link>
          </Button>
        )}
      </BarreTableau>

      <EnTeteTableau
        icon={espace.icon}
        theme="bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground"
        surtitre={estIntervenant ? "Mes demandes personnelles" : "Espace Demandeurs"}
        titre={`Chalom ${prenom}, de quoi avez-vous besoin ?`}
        texte="Téfilines, mezouza, 'hallot, bar-mitsva, cacheroute… Faites votre demande : l'intervenant le plus proche vient vous aider."
        badges={
          <>
            <PastilleEnTete>✓ Gratuit</PastilleEnTete>
            <PastilleEnTete>Suivi en direct</PastilleEnTete>
          </>
        }
        droite={
          <Button asChild size="lg" className="bg-accent text-accent-foreground shadow-lg hover:bg-accent/90">
            <a href="#nouvelle">
              <Plus /> Nouvelle demande
            </a>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CarteStat icon={PlayCircle} label="En cours" valeur={actives.length} accent="primary" detail="Suivies en direct" />
        <CarteStat icon={Sparkles} label="Mitsvot accomplies" valeur={terminees} accent="success" detail="Grâce à vos demandes" delai={80} />
        <CarteStat icon={History} label="Demandes faites" valeur={demandes.length} accent="accent" detail="Depuis le début" delai={160} />
        <CarteStat icon={CheckCircle2} label="Avis donnés" valeur={demandes.filter((d) => d.note).length} accent="muted" detail="Merci !" delai={240} />
      </div>

      {actives.length > 0 && (
        <section id="suivi" className="flex scroll-mt-24 flex-col gap-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            Suivi en direct
          </h2>
          <div className={cn("grid gap-4", actives.length > 1 && "xl:grid-cols-2")}>
            {actives.map((d) => (
              <SuiviDemande key={d.id} demande={d} onAnnuler={annuler} />
            ))}
          </div>
        </section>
      )}

      <CatalogueServices
        services={services}
        onChoisir={(espace, service) => {
          setPreselection((p) => ({ espace, service, n: (p?.n ?? 0) + 1 }))
          document.getElementById("nouvelle")?.scrollIntoView({ behavior: "smooth", block: "start" })
        }}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section id="nouvelle" className="scroll-mt-24 lg:col-span-2">
          <CarteWidget icon={Plus} titre="Nouvelle demande" sousTitre="En 5 petites étapes" delai={150}>
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
          <CarteWidget icon={History} titre="Historique" sousTitre="Vos demandes passées" delai={250}>
            <div className="max-h-96 overflow-y-auto pr-1">
              <HistoriqueDemandes demandes={passees} onNoter={noter} />
            </div>
          </CarteWidget>
          <CarteWidget icon={Lightbulb} titre="Bon à savoir" delai={350}>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>📍 Activez la localisation : l&apos;intervenant le plus proche est trouvé plus vite.</li>
              <li>🔔 Gardez cette page ouverte : vous êtes prévenu dès qu&apos;il accepte.</li>
              <li>⭐ Après l&apos;intervention, laissez une note pour remercier l&apos;intervenant.</li>
            </ul>
          </CarteWidget>
        </aside>
      </div>
    </main>
  )
}
