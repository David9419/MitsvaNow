// Fichier généré à partir de Supabase (projet « Mivstaim Now »).
// Ne pas modifier à la main : le regénérer après chaque migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abonnements_push: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          utilisateur_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          utilisateur_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abonnements_push_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avis: {
        Row: {
          commentaire: string | null
          created_at: string
          demande_id: string
          id: string
          note: number
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          demande_id: string
          id?: string
          note: number
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          demande_id?: string
          id?: string
          note?: number
        }
        Relationships: [
          {
            foreignKeyName: "avis_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: true
            referencedRelation: "demandes"
            referencedColumns: ["id"]
          },
        ]
      }
      demande_refus: {
        Row: {
          created_at: string
          demande_id: string
          intervenant_id: string
        }
        Insert: {
          created_at?: string
          demande_id: string
          intervenant_id: string
        }
        Update: {
          created_at?: string
          demande_id?: string
          intervenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demande_refus_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demande_refus_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demandes: {
        Row: {
          adresse: string | null
          created_at: string
          demandeur_id: string
          id: string
          intervenant_id: string | null
          message: string | null
          position: unknown
          service_id: string
          statut: Database["public"]["Enums"]["statut_demande"]
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          demandeur_id: string
          id?: string
          intervenant_id?: string | null
          message?: string | null
          position: unknown
          service_id: string
          statut?: Database["public"]["Enums"]["statut_demande"]
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          demandeur_id?: string
          id?: string
          intervenant_id?: string | null
          message?: string | null
          position?: unknown
          service_id?: string
          statut?: Database["public"]["Enums"]["statut_demande"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandes_demandeur_id_fkey"
            columns: ["demandeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      espaces: {
        Row: {
          description: string | null
          id: string
          nom: string
          ordre: number
          slug: string
        }
        Insert: {
          description?: string | null
          id?: string
          nom: string
          ordre?: number
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          nom?: string
          ordre?: number
          slug?: string
        }
        Relationships: []
      }
      intervenant_services: {
        Row: {
          intervenant_id: string
          service_id: string
        }
        Insert: {
          intervenant_id: string
          service_id: string
        }
        Update: {
          intervenant_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervenant_services_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervenant_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      intervenants: {
        Row: {
          adresse: string | null
          created_at: string
          disponible: boolean
          espace_id: string
          id: string
          position: unknown
          rayon_km: number
          type: Database["public"]["Enums"]["type_intervenant"]
          validation: Database["public"]["Enums"]["statut_validation"]
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          disponible?: boolean
          espace_id: string
          id: string
          position?: unknown
          rayon_km?: number
          type: Database["public"]["Enums"]["type_intervenant"]
          validation?: Database["public"]["Enums"]["statut_validation"]
        }
        Update: {
          adresse?: string | null
          created_at?: string
          disponible?: boolean
          espace_id?: string
          id?: string
          position?: unknown
          rayon_km?: number
          type?: Database["public"]["Enums"]["type_intervenant"]
          validation?: Database["public"]["Enums"]["statut_validation"]
        }
        Relationships: [
          {
            foreignKeyName: "intervenants_espace_id_fkey"
            columns: ["espace_id"]
            isOneToOne: false
            referencedRelation: "espaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervenants_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          espace_id: string | null
          est_admin: boolean
          id: string
          nom: string
          position: unknown
          prenom: string
          telephone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          espace_id?: string | null
          est_admin?: boolean
          id: string
          nom?: string
          prenom?: string
          telephone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          espace_id?: string | null
          est_admin?: boolean
          id?: string
          nom?: string
          prenom?: string
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_espace_id_fkey"
            columns: ["espace_id"]
            isOneToOne: false
            referencedRelation: "espaces"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          actif: boolean
          description: string | null
          espace_id: string
          id: string
          nom: string
          ordre: number
        }
        Insert: {
          actif?: boolean
          description?: string | null
          espace_id: string
          id?: string
          nom: string
          ordre?: number
        }
        Update: {
          actif?: boolean
          description?: string | null
          espace_id?: string
          id?: string
          nom?: string
          ordre?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_espace_id_fkey"
            columns: ["espace_id"]
            isOneToOne: false
            referencedRelation: "espaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      annuler_demande: { Args: { p_demande: string }; Returns: undefined }
      avancer_demande: {
        Args: { p_demande: string }
        Returns: Database["public"]["Enums"]["statut_demande"]
      }
      creer_demande: {
        Args: {
          p_adresse?: string
          p_lat: number
          p_lng: number
          p_message?: string
          p_service: string
          p_telephone: string
        }
        Returns: string
      }
      est_admin: { Args: never; Returns: boolean }
      enregistrer_abonnement_push: {
        Args: { p_auth: string; p_endpoint: string; p_p256dh: string }
        Returns: undefined
      }
      enregistrer_ma_position: {
        Args: { p_adresse?: string; p_lat: number; p_lng: number }
        Returns: undefined
      }
      ma_position: { Args: never; Returns: Json }
      mettre_a_jour_intervenant: {
        Args: {
          p_adresse?: string
          p_disponible?: boolean
          p_lat?: number
          p_lng?: number
          p_rayon_km?: number
        }
        Returns: undefined
      }
      supprimer_abonnement_push: {
        Args: { p_endpoint: string }
        Returns: undefined
      }
      repondre_demande: {
        Args: { p_accepter: boolean; p_demande: string }
        Returns: undefined
      }
      tableau_demandeur: { Args: never; Returns: Json }
      tableau_intervenant: { Args: never; Returns: Json }
    }
    Enums: {
      statut_demande:
        | "en_attente"
        | "acceptee"
        | "en_cours"
        | "terminee"
        | "annulee"
      statut_validation: "en_attente" | "valide" | "refuse"
      type_intervenant:
        | "bahour"
        | "femme"
        | "sofer"
        | "rav"
        | "rabbanit"
        | "chaliah"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends {
  Row: infer R
}
  ? R
  : never

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      statut_demande: [
        "en_attente",
        "acceptee",
        "en_cours",
        "terminee",
        "annulee",
      ],
      statut_validation: ["en_attente", "valide", "refuse"],
      type_intervenant: [
        "bahour",
        "femme",
        "sofer",
        "rav",
        "rabbanit",
        "chaliah",
      ],
    },
  },
} as const
