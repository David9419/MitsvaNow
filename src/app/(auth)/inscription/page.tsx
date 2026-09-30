import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { InscriptionForm } from "@/components/auth/inscription-form"
import { obtenirDico } from "@/lib/i18n/serveur"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.inscription }
}

export default async function InscriptionPage(props: PageProps<"/inscription">) {
  const { espace, role } = await props.searchParams
  // Depuis le bouton d'un espace : l'espace est déjà choisi.
  // « Devenir intervenant » : on choisit parmi les 4 espaces d'intervenants.
  // Sinon (bouton « S'inscrire ») : on choisit parmi les 5 espaces.
  return (
    <AuthShell>
      <InscriptionForm
        espaceFixe={typeof espace === "string" ? espace : undefined}
        choix={role === "intervenant" ? "intervenants" : "tous"}
      />
    </AuthShell>
  )
}
