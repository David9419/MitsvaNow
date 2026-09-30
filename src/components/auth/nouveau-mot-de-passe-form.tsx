"use client"

import { useActionState } from "react"
import { KeyRound, Loader2 } from "lucide-react"

import { changerMotDePasse } from "@/app/(auth)/actions"
import { ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"

/** Choix du nouveau mot de passe, après avoir ouvert le lien reçu par e-mail. */
export function NouveauMotDePasseForm({ email }: { email: string }) {
  const [etat, action, enCours] = useActionState(changerMotDePasse, undefined)
  const t = useT()
  const n = t.auth.nouveau

  return (
    <div>
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{n.titre}</h1>
        <p className="mt-2 text-muted-foreground">
          {n.texteAvant} <strong className="text-foreground">{email}</strong>.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        {/* Aide les gestionnaires de mots de passe (trousseau iCloud…) à enregistrer le bon compte */}
        <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
        <ChampMotDePasse
          label={n.label}
          autoComplete="new-password"
          aide={n.aide}
        />

        <MessageErreur message={etat?.erreur} />

        <Button type="submit" size="lg" disabled={enCours} className="h-12 text-base shadow-lg shadow-primary/25">
          {enCours ? (
            <>
              <Loader2 className="animate-spin" /> {t.commun.enregistrement}
            </>
          ) : (
            n.bouton
          )}
        </Button>
      </form>
    </div>
  )
}
