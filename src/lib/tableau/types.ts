import type { Enums } from "@/lib/database.types"
import type { TypeIntervenant } from "@/lib/espaces"

export type StatutDemande = Enums<"statut_demande">

/** Une demande vue par l'intervenant (renvoyée par tableau_intervenant). */
export type DemandeIntervenant = {
  id: string
  statut: StatutDemande
  created_at: string
  updated_at: string
  service: string
  message: string | null
  distance_m: number | null
  adresse: string | null
  lat: number | null
  lng: number | null
  demandeur_prenom: string
  demandeur_nom: string | null
  demandeur_telephone: string | null
  demandeur_id: string | null
}

export type DonneesIntervenant = {
  intervenant: {
    type: TypeIntervenant
    validation: Enums<"statut_validation">
    disponible: boolean
    rayon_km: number
    espace_slug: string
    espace_nom: string
    lat: number | null
    lng: number | null
  } | null
  demandes: DemandeIntervenant[]
  services: { id: string; nom: string; propose: boolean }[]
}

/** Une demande vue par le demandeur (renvoyée par tableau_demandeur). */
export type DemandeDemandeur = {
  id: string
  statut: StatutDemande
  created_at: string
  updated_at: string
  service: string
  espace_slug: string
  espace_nom: string
  adresse: string | null
  message: string | null
  intervenant_trouve: boolean
  intervenant_prenom: string | null
  intervenant_telephone: string | null
  intervenant_type: TypeIntervenant | null
  distance_m: number | null
  note: number | null
}
