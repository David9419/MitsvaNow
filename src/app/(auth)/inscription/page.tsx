import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { InscriptionForm } from "@/components/auth/inscription-form"

export const metadata: Metadata = { title: "Créer un compte — Mivtsa Now" }

export default async function InscriptionPage(props: PageProps<"/inscription">) {
  const { espace, role } = await props.searchParams
  // « Devenir intervenant » sans espace précis : on laisse choisir ; sinon « Demandeurs » par défaut
  const espaceParDefaut = typeof espace === "string" ? espace : role === "intervenant" ? undefined : "demandeurs"
  return (
    <AuthShell>
      <InscriptionForm espaceInitial={espaceParDefaut} />
    </AuthShell>
  )
}
