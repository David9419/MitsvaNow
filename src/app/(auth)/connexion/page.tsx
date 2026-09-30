import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { ConnexionForm } from "@/components/auth/connexion-form"
import { obtenirDico } from "@/lib/i18n/serveur"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.connexion }
}

export default async function ConnexionPage(props: PageProps<"/connexion">) {
  const { espace, erreur } = await props.searchParams
  const t = await obtenirDico()
  return (
    <AuthShell>
      <ConnexionForm
        espaceInitial={typeof espace === "string" ? espace : undefined}
        erreurInitiale={
          erreur === "lien" ? t.auth.connexion.lienInvalide : undefined
        }
      />
    </AuthShell>
  )
}
