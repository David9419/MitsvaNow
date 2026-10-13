import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageAdmin, type CompteAdmin } from "@/components/admin/page-admin"
import type { SignalementAdmin } from "@/components/admin/signalements-admin"
import type { StatistiquesAdmin } from "@/components/admin/tableau-de-bord-admin"
import { obtenirDico } from "@/lib/i18n/serveur"
import { chargerSession } from "@/lib/tableau/charger"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.admin }
}

/** Administration : vérification des comptes (réservée aux administrateurs, contrôlé aussi par la base). */
export default async function AdminPage() {
  const { supabase, user, estAdmin } = await chargerSession()
  if (!estAdmin) notFound()

  const [{ data, error }, { data: stats }, { data: signalements }] = await Promise.all([
    supabase.rpc("admin_comptes"),
    supabase.rpc("admin_statistiques"),
    supabase.rpc("admin_signalements"),
  ])
  if (error) notFound()

  return (
    <PageAdmin
      utilisateurId={user.id}
      initial={(data as unknown as CompteAdmin[]) ?? []}
      statistiques={(stats as unknown as StatistiquesAdmin | null) ?? null}
      signalementsInitiaux={(signalements as unknown as SignalementAdmin[] | null) ?? []}
    />
  )
}
