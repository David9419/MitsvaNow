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
          created_at: string
          est_admin: boolean
          id: string
          nom: string
          prenom: string
          telephone: string | null
        }
        Insert: {
          created_at?: string
          est_admin?: boolean
          id: string
          nom?: string
          prenom?: string
          telephone?: string | null
        }
        Update: {
          created_at?: string
          est_admin?: boolean
          id?: string
          nom?: string
          prenom?: string
          telephone?: string | null
        }
        Relationships: []
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
      est_admin: { Args: never; Returns: boolean }
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
