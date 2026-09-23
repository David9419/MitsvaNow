import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Clock, Construction, LogOut } from "lucide-react"

import { deconnexion } from "@/app/(auth)/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Mon espace — Mivtsa Now" }

export default async function AccueilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/connexion")

  const [{ data: profil }, { data: intervenant }] = await Promise.all([
    supabase.from("profiles").select("prenom").eq("id", user.id).maybeSingle(),
    supabase
      .from("intervenants")
      .select("type, validation, espaces(nom)")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="animate-in fade-in slide-in-from-bottom-4 text-3xl font-bold tracking-tight duration-700 md:text-5xl">
        Bienvenue{profil?.prenom ? `, ${profil.prenom}` : ""} !
      </h1>

      {intervenant && (
        <Badge variant="secondary" className="animate-in fade-in gap-2 px-3 py-1.5 text-sm delay-200 duration-700 fill-mode-both">
          <Clock className="size-4" />
          Intervenant ({intervenant.espaces?.nom}) —{" "}
          {intervenant.validation === "valide"
            ? "profil validé"
            : intervenant.validation === "refuse"
              ? "profil refusé"
              : "en attente de validation"}
        </Badge>
      )}

      <div className="animate-in fade-in flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-muted-foreground delay-300 duration-700 fill-mode-both">
        <Construction className="size-10 text-accent" />
        <p>Votre page d&apos;accueil est en construction. Elle arrive bientôt !</p>
      </div>

      <form action={deconnexion}>
        <Button type="submit" variant="outline">
          <LogOut /> Se déconnecter
        </Button>
      </form>
    </main>
  )
}
