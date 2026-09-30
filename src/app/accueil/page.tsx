import type { Metadata } from "next"

import { TableauDemandeur } from "@/components/tableau/tableau-demandeur"
import { TableauIntervenant } from "@/components/tableau/tableau-intervenant"
import { obtenirDico } from "@/lib/i18n/serveur"
import { chargerSession, chargerTableauDemandeur, chargerTableauIntervenant } from "@/lib/tableau/charger"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.tableau }
}

/** Le bon tableau de bord selon l'espace de la personne. */
export default async function AccueilPage() {
  const { supabase, user, prenom, estIntervenant } = await chargerSession()

  if (estIntervenant) {
    const donnees = await chargerTableauIntervenant(supabase)
    if (donnees?.intervenant) {
      return <TableauIntervenant utilisateurId={user.id} prenom={prenom} initial={donnees} />
    }
  }

  const { demandes, services, position, telephone } = await chargerTableauDemandeur(supabase)
  return <TableauDemandeur utilisateurId={user.id} prenom={prenom} initial={demandes} services={services} positionInitiale={position} telephone={telephone} />
}
