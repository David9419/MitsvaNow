import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { ConnexionForm } from "@/components/auth/connexion-form"

export const metadata: Metadata = { title: "Connexion — Mivtsa Now" }

export default async function ConnexionPage(props: PageProps<"/connexion">) {
  const { espace, erreur } = await props.searchParams
  return (
    <AuthShell>
      <ConnexionForm
        espaceInitial={typeof espace === "string" ? espace : undefined}
        erreurInitiale={
          erreur === "lien"
            ? "Ce lien n'est plus valide (déjà utilisé, expiré, ou ouvert sur un autre appareil). Refaites la demande depuis cet appareil."
            : undefined
        }
      />
    </AuthShell>
  )
}
