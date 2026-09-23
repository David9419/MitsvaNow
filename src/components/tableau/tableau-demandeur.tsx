"use client"

import Link from "next/link"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, BellRing, CheckCircle2, History, LogOut, PlayCircle, Plus, Sparkles } from "lucide-react"

import { deconnexion } from "@/app/(auth)/actions"
import { BanniereLocalisation } from "@/components/tableau/banniere-localisation"
import { CarteStat } from "@/components/tableau/carte-stat"
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
import type { DemandeDemandeur } from "@/lib/tableau/types"

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
  estIntervenant = false,
}: {
  utilisateurId: string
  prenom: string
  initial: DemandeDemandeur[]
  services: ServiceDisponible[]
  estIntervenant?: boolean
}) {
  const [demandes, setDemandes] = useState(initial)
  const supabase = useRef(createClient()).current
  const statuts = useRef(new Map(initial.map((d) => [d.id, d.statut])))
  const loc = useLocalisation()
  const espace = ESPACES[0]

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

  const activerLocalisation = async () => {
    const p = await loc.activer()
    if (p) toast.success("Localisation activée", { description: "Nous pourrons trouver l'intervenant le plus proche." })
    else toast.error("Localisation refusée", { description: "Vous pouvez aussi taper votre adresse." })
    return p
  }

  const envoyer = async (f: { service: string; lat: number; lng: number; adresse: string | null; message: string }) => {
    const { error } = await supabase.rpc("creer_demande", {
      p_service: f.service,
      p_lat: f.lat,
      p_lng: f.lng,
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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <BanniereLocalisation
        etat={loc.etat}
        onActiver={activerLocalisation}
        texte="Pour trouver l'intervenant le plus proche de vous, Mivtsa Now a besoin de votre position."
      />

      <EnTeteTableau
        icon={espace.icon}
        theme="bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground"
        surtitre={estIntervenant ? "Mes demandes personnelles" : "Espace Demandeurs"}
        titre={`Chalom ${prenom}, de quoi avez-vous besoin ?`}
        texte="Téfilines, 'hallot, cachérisation, un cours… Faites votre demande : l'intervenant le plus proche vient vous aider."
        badges={
          <>
            <PastilleEnTete>✓ Gratuit</PastilleEnTete>
            <PastilleEnTete>Suivi en direct</PastilleEnTete>
          </>
        }
        droite={
          <div className="flex gap-2 md:flex-col md:items-end">
            <Button asChild size="lg" className="bg-accent text-accent-foreground shadow-lg hover:bg-accent/90">
              <a href="#nouvelle">
                <Plus /> Nouvelle demande
              </a>
            </Button>
            <div className="flex gap-2">
              {estIntervenant && (
                <Button asChild size="sm" variant="secondary">
                  <Link href="/accueil">
                    <ArrowLeft /> Mon tableau de bord
                  </Link>
                </Button>
              )}
              <form action={deconnexion}>
                <Button size="sm" variant="secondary" type="submit" aria-label="Se déconnecter">
                  <LogOut />
                </Button>
              </form>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CarteStat icon={PlayCircle} label="En cours" valeur={actives.length} accent="primary" detail="Suivies en direct" />
        <CarteStat icon={Sparkles} label="Mitsvot accomplies" valeur={terminees} accent="success" detail="Grâce à vos demandes" delai={80} />
        <CarteStat icon={History} label="Demandes faites" valeur={demandes.length} accent="accent" detail="Depuis le début" delai={160} />
        <CarteStat icon={CheckCircle2} label="Avis donnés" valeur={demandes.filter((d) => d.note).length} accent="muted" detail="Merci !" delai={240} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          {actives.length > 0 && (
            <section id="suivi" className="flex scroll-mt-24 flex-col gap-4">
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-success" />
                </span>
                Suivi en direct
              </h2>
              {actives.map((d) => (
                <SuiviDemande key={d.id} demande={d} onAnnuler={annuler} />
              ))}
            </section>
          )}

          <section id="nouvelle" className="scroll-mt-24">
            <CarteWidget icon={Plus} titre="Nouvelle demande" sousTitre="En 4 petites étapes" delai={150}>
              <FormulaireDemande
                services={services}
                position={loc.position}
                etatLocalisation={loc.etat}
                onActiverLocalisation={activerLocalisation}
                onEnvoyer={envoyer}
              />
            </CarteWidget>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <History className="size-5 text-primary" /> Historique
          </h2>
          <HistoriqueDemandes demandes={passees} onNoter={noter} />
        </aside>
      </div>
    </main>
  )
}
