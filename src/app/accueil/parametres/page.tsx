import type { Metadata } from "next"

import { PageParametres } from "@/components/parametres/page-parametres"
import { obtenirDico } from "@/lib/i18n/serveur"
import { chargerSession } from "@/lib/tableau/charger"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.parametres }
}

/** Paramètres du compte : photo, nom, mot de passe, notifications, thème, langue. */
export default async function ParametresPage() {
  const { supabase, user } = await chargerSession()
  const { data: profil } = await supabase
    .from("profiles")
    .select("prenom, nom, telephone, email, photo_url")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <PageParametres
      utilisateurId={user.id}
      profil={{
        prenom: profil?.prenom ?? "",
        nom: profil?.nom ?? "",
        telephone: profil?.telephone ?? "",
        email: profil?.email ?? user.email ?? "",
        photo: profil?.photo_url ?? null,
      }}
    />
  )
}
