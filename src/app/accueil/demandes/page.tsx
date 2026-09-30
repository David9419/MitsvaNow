import type { Metadata } from "next"

import { TableauDemandeur } from "@/components/tableau/tableau-demandeur"
import { obtenirDico } from "@/lib/i18n/serveur"
import { chargerSession, chargerTableauDemandeur } from "@/lib/tableau/charger"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.mesDemandes }
}

/** Les demandes personnelles (utile aux intervenants qui ont eux-mêmes un besoin). */
export default async function MesDemandesPage() {
  const { supabase, user, prenom, estIntervenant } = await chargerSession()
  const { demandes, services, position, telephone } = await chargerTableauDemandeur(supabase)
  return (
    <TableauDemandeur
      utilisateurId={user.id}
      prenom={prenom}
      initial={demandes}
      services={services}
      positionInitiale={position}
      telephone={telephone}
      estIntervenant={estIntervenant}
    />
  )
}
