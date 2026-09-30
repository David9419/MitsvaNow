import type { Enums } from "@/lib/database.types"
import type { TypeIntervenant } from "@/lib/espaces"
import type { Langue } from "@/lib/i18n"

export type StatutDemande = Enums<"statut_demande">

/** Nom d'un service dans les 3 langues. */
export type NomsService = Record<Langue, string>

export type Transport = "a_pied" | "trottinette" | "velo" | "voiture" | "transports"
export const TRANSPORTS: Transport[] = ["a_pied", "trottinette", "velo", "voiture", "transports"]

/** Une demande vue par l'intervenant (renvoyée par tableau_intervenant). */
export type DemandeIntervenant = {
  id: string
  statut: StatutDemande
  created_at: string
  updated_at: string
  service: string
  service_noms: NomsService | null
  message: string | null
  distance_m: number | null
  adresse: string | null
  lat: number | null
  lng: number | null
  programmee_pour: string | null
  attribuee_le: string | null
  transport: Transport | null
  eta_minutes: number | null
  confirmee: boolean
  annulee_par: "demandeur" | "intervenant" | "systeme" | null
  motif_annulation: string | null
  demandeur_prenom: string
  demandeur_nom: string | null
  demandeur_photo: string | null
  demandeur_telephone: string | null
  demandeur_id: string | null
}

/** Un avis laissé par un demandeur. */
export type Avis = {
  id: string
  note: number
  commentaire: string | null
  created_at: string
  prenom: string
  nom: string | null
  photo: string | null
  service: string
  service_noms: NomsService | null
}

export type ResumeAvis = { moyenne: number | null; nombre: number; liste: Avis[] }

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
    adresse: string | null
  } | null
  demandes: DemandeIntervenant[]
  services: { id: string; nom: string; noms: NomsService | null; propose: boolean }[]
  avis: ResumeAvis
}

/** Un avis sur l'intervenant, tel que le voit le demandeur. */
export type AvisPublic = {
  prenom: string
  initiale: string
  note: number
  commentaire: string | null
  created_at: string
}

/** Une demande vue par le demandeur (renvoyée par tableau_demandeur). */
export type DemandeDemandeur = {
  id: string
  statut: StatutDemande
  created_at: string
  updated_at: string
  service: string
  service_noms: NomsService | null
  espace_slug: string
  espace_nom: string
  adresse: string | null
  message: string | null
  programmee_pour: string | null
  annulee_par: "demandeur" | "intervenant" | "systeme" | null
  motif_annulation: string | null
  intervenant_trouve: boolean
  intervenant_prenom: string | null
  intervenant_nom: string | null
  intervenant_photo: string | null
  intervenant_telephone: string | null
  intervenant_type: TypeIntervenant | null
  transport: Transport | null
  eta_minutes: number | null
  acceptee_le: string | null
  confirmee: boolean
  distance_m: number | null
  intervenant_avis: { moyenne: number | null; nombre: number; liste: AvisPublic[] } | null
  note: number | null
  commentaire: string | null
}

/** Position enregistrée dans le profil (renvoyée par ma_position). */
export type PositionEnregistree = { lat: number; lng: number; adresse: string | null } | null
