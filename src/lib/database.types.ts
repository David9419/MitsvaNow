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
          acceptee_le: string | null
          adresse: string | null
          annulee_par: string | null
          attribuee_le: string | null
          confirmee: boolean
          created_at: string
          demandeur_id: string
          eta_minutes: number | null
          id: string
          intervenant_id: string | null
          message: string | null
          motif_annulation: string | null
          position: unknown
          programmee_pour: string | null
          recherche_depuis: string
          service_id: string
          statut: Database["public"]["Enums"]["statut_demande"]
          telephone: string | null
          transport: string | null
          updated_at: string
        }
        Insert: {
          acceptee_le?: string | null
          adresse?: string | null
          annulee_par?: string | null
          attribuee_le?: string | null
          confirmee?: boolean
          created_at?: string
          demandeur_id: string
          eta_minutes?: number | null
          id?: string
          intervenant_id?: string | null
          message?: string | null
          motif_annulation?: string | null
          position: unknown
          programmee_pour?: string | null
          recherche_depuis?: string
          service_id: string
          statut?: Database["public"]["Enums"]["statut_demande"]
          telephone?: string | null
          transport?: string | null
          updated_at?: string
        }
        Update: {
          acceptee_le?: string | null
          adresse?: string | null
          annulee_par?: string | null
          attribuee_le?: string | null
          confirmee?: boolean
          created_at?: string
          demandeur_id?: string
          eta_minutes?: number | null
          id?: string
          intervenant_id?: string | null
          message?: string | null
          motif_annulation?: string | null
          position?: unknown
          programmee_pour?: string | null
          recherche_depuis?: string
          service_id?: string
          statut?: Database["public"]["Enums"]["statut_demande"]
          telephone?: string | null
          transport?: string | null
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
          langue: string
          nom: string
          photo_url: string | null
          position: unknown
          prenom: string
          telephone: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          espace_id?: string | null
          est_admin?: boolean
          id: string
          langue?: string
          nom?: string
          photo_url?: string | null
          position?: unknown
          prenom?: string
          telephone?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          espace_id?: string | null
          est_admin?: boolean
          id?: string
          langue?: string
          nom?: string
          photo_url?: string | null
          position?: unknown
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
          nom_en: string | null
          nom_he: string | null
          ordre: number
        }
        Insert: {
          actif?: boolean
          description?: string | null
          espace_id: string
          id?: string
          nom: string
          nom_en?: string | null
          nom_he?: string | null
          ordre?: number
        }
        Update: {
          actif?: boolean
          description?: string | null
          espace_id?: string
          id?: string
          nom?: string
          nom_en?: string | null
          nom_he?: string | null
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
      abonnements_de: { Args: { p_utilisateur: string }; Returns: Json }
      annuler_demande: {
        Args: { p_demande: string; p_motif?: string }
        Returns: undefined
      }
      annuler_intervention: {
        Args: { p_demande: string; p_motif: string }
        Returns: undefined
      }
      attribuer_demande: { Args: { p_demande: string }; Returns: string }
      avancer_demande: {
        Args: { p_demande: string }
        Returns: Database["public"]["Enums"]["statut_demande"]
      }
      confirmer_intervenant: {
        Args: { p_confirmer: boolean; p_demande: string }
        Returns: undefined
      }
      creer_demande: {
        Args: {
          p_adresse?: string
          p_lat: number
          p_lng: number
          p_message?: string
          p_programmee_pour?: string
          p_service: string
          p_telephone: string
        }
        Returns: string
      }
      definir_langue: { Args: { p_langue: string }; Returns: undefined }
      definir_photo: { Args: { p_url: string }; Returns: undefined }
      email_inscrit: { Args: { p_email: string }; Returns: boolean }
      enregistrer_abonnement_push: {
        Args: { p_auth: string; p_endpoint: string; p_p256dh: string }
        Returns: undefined
      }
      enregistrer_ma_position: {
        Args: { p_adresse?: string; p_lat: number; p_lng: number }
        Returns: undefined
      }
      est_admin: { Args: never; Returns: boolean }
      expirer_demandes: { Args: never; Returns: undefined }
      infos_notification: {
        Args: { p_demande: string; p_destinataire: string }
        Returns: Json
      }
      langue_de: { Args: { p_utilisateur: string }; Returns: string }
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
      noms_service: {
        Args: { s: Database["public"]["Tables"]["services"]["Row"] }
        Returns: Json
      }
      notifier: {
        Args: { p_demande: string; p_destinataire: string; p_evenement: string }
        Returns: undefined
      }
      point_gps: { Args: { p_lat: number; p_lng: number }; Returns: unknown }
      preparer_notification_demandeur: {
        Args: { p_demande: string }
        Returns: Json
      }
      preparer_notification_push: { Args: { p_demande: string }; Returns: Json }
      repondre_demande: {
        Args: {
          p_accepter: boolean
          p_demande: string
          p_eta_minutes?: number
          p_transport?: string
        }
        Returns: undefined
      }
      secrets_push: { Args: never; Returns: Json }
      supprimer_abonnement_push: {
        Args: { p_endpoint: string }
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
        | "expiree"
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
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      statut_demande: [
        "en_attente",
        "acceptee",
        "en_cours",
        "terminee",
        "annulee",
        "expiree",
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
