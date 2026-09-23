import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { InscriptionForm } from "@/components/auth/inscription-form"

export const metadata: Metadata = { title: "Créer un compte — Mivtsa Now" }

export default async function InscriptionPage(props: PageProps<"/inscription">) {
  const { espace, role } = await props.searchParams
  return (
    <AuthShell>
      <InscriptionForm
        espaceInitial={typeof espace === "string" ? espace : undefined}
        roleInitial={role === "intervenant" ? "intervenant" : "demandeur"}
      />
    </AuthShell>
  )
}
