"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2 } from "lucide-react"

import { connexion } from "@/app/(auth)/actions"
import { Champ, ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Content de vous revoir</CardTitle>
        <CardDescription>
          {espace ? (
            <>
              Connexion à l&apos;espace <strong className="text-primary">{espace.nom}</strong>.
            </>
          ) : (
            "Connectez-vous pour faire une demande ou suivre les vôtres."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-5">
          <Champ
            label="E-mail"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.fr"
            required
            defaultValue={etat?.champs?.email}
          />
          <ChampMotDePasse autoComplete="current-password" />

          <MessageErreur message={etat?.erreur ?? (etat ? undefined : erreurInitiale)} />

          <Button type="submit" size="lg" disabled={enCours} className="h-12 text-base">
            {enCours ? (
              <>
                <Loader2 className="animate-spin" /> Connexion…
              </>
            ) : (
              "Se connecter"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href={espace ? `/inscription?espace=${espace.slug}` : "/inscription"}
              className="font-medium text-primary hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
