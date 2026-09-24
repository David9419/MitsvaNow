import type { Metadata } from "next"

import { TableauDemandeur } from "@/components/tableau/tableau-demandeur"
import { chargerSession, chargerTableauDemandeur } from "@/lib/tableau/charger"

export const metadata: Metadata = { title: "Mes demandes — Mivtsa Now" }

/** Les demandes personnelles (utile aux intervenants qui ont eux-mêmes un besoin). */
export default async function MesDemandesPage() {
  const { supabase, user, prenom, estIntervenant } = await chargerSession()
  const { demandes, services, position } = await chargerTableauDemandeur(supabase)
  return (
    <TableauDemandeur
      utilisateurId={user.id}
      prenom={prenom}
      initial={demandes}
      services={services}
      positionInitiale={position}
      estIntervenant={estIntervenant}
    />
  )
}
