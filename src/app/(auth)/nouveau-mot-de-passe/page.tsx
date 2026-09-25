import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { NouveauMotDePasseForm } from "@/components/auth/nouveau-mot-de-passe-form"
import { utilisateurConnecte } from "@/lib/supabase/utilisateur"

export const metadata: Metadata = { title: "Nouveau mot de passe — Mivtsa Now" }

export default async function NouveauMotDePassePage() {
  // On arrive ici depuis le lien de l'e-mail, qui a ouvert la session
  const utilisateur = await utilisateurConnecte()
  if (!utilisateur) redirect("/connexion?erreur=lien")

  return (
    <AuthShell>
      <NouveauMotDePasseForm email={utilisateur.email ?? ""} />
    </AuthShell>
  )
}
