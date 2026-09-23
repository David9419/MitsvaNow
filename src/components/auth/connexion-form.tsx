"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2, Mail } from "lucide-react"

import { connexion } from "@/app/(auth)/actions"
import { Champ, ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { trouverEspace } from "@/lib/espaces"

export function ConnexionForm({
  espaceInitial,
  erreurInitiale,
}: {
  espaceInitial?: string
  erreurInitiale?: string
}) {
  const [etat, action, enCours] = useActionState(connexion, undefined)
  const espace = trouverEspace(espaceInitial)

  return (
    <div>
      <div className="mb-8">
        {espace && (
          <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
            <espace.icon className="size-3.5" />
            Espace {espace.nom}
          </Badge>
        )}
        <h1 className="text-3xl font-bold tracking-tight">Content de vous revoir</h1>
        <p className="mt-2 text-muted-foreground">
          Entrez votre e-mail et votre mot de passe pour vous connecter.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <Champ
          label="E-mail"
          id="email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          required
          defaultValue={etat?.champs?.email}
        />
        <ChampMotDePasse autoComplete="current-password" />

        <MessageErreur message={etat?.erreur ?? (etat ? undefined : erreurInitiale)} />

        <Button type="submit" size="lg" disabled={enCours} className="h-12 text-base shadow-lg shadow-primary/25">
          {enCours ? (
            <>
              <Loader2 className="animate-spin" /> Connexion…
            </>
          ) : (
            "Se connecter"
          )}
        </Button>

        <div className="relative my-2 text-center text-sm text-muted-foreground">
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          <span className="relative bg-background px-3">Pas encore de compte ?</span>
        </div>

        <Button asChild variant="outline" size="lg" className="h-12 text-base">
          <Link href={espace ? `/inscription?espace=${espace.slug}` : "/inscription"}>
            Créer un compte
          </Link>
        </Button>
      </form>
    </div>
  )
}
