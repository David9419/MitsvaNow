import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { obtenirDico } from "@/lib/i18n/serveur"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.compteSupprime }
}

/** Page affichée juste après la suppression d'un compte. */
export default async function CompteSupprimePage() {
  const t = await obtenirDico()
  const c = t.compteSupprime
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="flex size-16 animate-in zoom-in items-center justify-center rounded-full bg-success/15 text-success duration-500">
        <CheckCircle2 className="size-8" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">{c.titre}</h1>
      <p className="text-muted-foreground">{c.texte}</p>
      <Button asChild className="mt-2">
        <Link href="/">{c.accueil}</Link>
      </Button>
    </main>
  )
}
