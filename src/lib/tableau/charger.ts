import "server-only"

import { redirect } from "next/navigation"

import type { ServiceDisponible } from "@/components/tableau/formulaire-demande"
import { createClient } from "@/lib/supabase/server"
import type { DemandeDemandeur, DonneesIntervenant, PositionEnregistree } from "@/lib/tableau/types"

/** Utilisateur connecté + prénom + fiche intervenant (s'il en a une). */
export async function chargerSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/connexion")

  const [{ data: profil }, { data: intervenant }] = await Promise.all([
    supabase.from("profiles").select("prenom").eq("id", user.id).maybeSingle(),
    supabase.from("intervenants").select("id").eq("id", user.id).maybeSingle(),
  ])
  const prenom = (profil?.prenom || "").trim()
  return {
    supabase,
    user,
    prenom: prenom.charAt(0).toUpperCase() + prenom.slice(1),
    estIntervenant: Boolean(intervenant),
  }
}

export async function chargerTableauIntervenant(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.rpc("tableau_intervenant")
  return data as unknown as DonneesIntervenant
}

export async function chargerTableauDemandeur(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data }, { data: services }, { data: position }] = await Promise.all([
    supabase.rpc("tableau_demandeur"),
    supabase.from("services").select("id, nom, ordre, espaces(slug)").eq("actif", true).order("ordre"),
    supabase.rpc("ma_position"),
  ])
  return {
    demandes: ((data as unknown as { demandes: DemandeDemandeur[] } | null)?.demandes ?? []),
    services: (services ?? []).map<ServiceDisponible>((s) => ({
      id: s.id,
      nom: s.nom,
      espace_slug: s.espaces?.slug ?? "",
    })),
    position: (position as unknown as PositionEnregistree) ?? null,
  }
}
