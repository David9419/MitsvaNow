import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { MotDePasseOublieForm } from "@/components/auth/mot-de-passe-oublie-form"
import { obtenirDico } from "@/lib/i18n/serveur"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.oublie }
}

export default function MotDePasseOubliePage() {
  return (
    <AuthShell>
      <MotDePasseOublieForm />
    </AuthShell>
  )
}
