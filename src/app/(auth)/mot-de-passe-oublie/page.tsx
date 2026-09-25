import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { MotDePasseOublieForm } from "@/components/auth/mot-de-passe-oublie-form"

export const metadata: Metadata = { title: "Mot de passe oublié — Mivtsa Now" }

export default function MotDePasseOubliePage() {
  return (
    <AuthShell>
      <MotDePasseOublieForm />
    </AuthShell>
  )
}
