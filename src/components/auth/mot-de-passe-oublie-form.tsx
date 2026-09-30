"use client"

import Link from "next/link"
import { useActionState } from "react"
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react"

import { demanderNouveauMotDePasse } from "@/app/(auth)/actions"
import { Champ, MessageErreur } from "@/components/auth/champ"
import { useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"

/** « Mot de passe oublié » : on tape son e-mail pour recevoir un lien. */
export function MotDePasseOublieForm() {
  const [etat, action, enCours] = useActionState(demanderNouveauMotDePasse, undefined)
  const t = useT()
  const o = t.auth.oublie

  if (etat?.succes) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 animate-in zoom-in items-center justify-center rounded-full bg-success text-success-foreground duration-500">
          <MailCheck className="size-8" />
        </div>
        <h1 className="text-2xl font-bold">{t.auth.inscription.verifierEmails}</h1>
        <p className="mt-3 text-muted-foreground">{etat.succes}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {o.spamAvant} <strong>{o.spamFort}</strong>
          {o.spamApres}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/connexion">{o.retour}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/connexion"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" /> {o.retour}
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{o.titre}</h1>
        <p className="mt-2 text-muted-foreground">
          {o.texte}
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <Champ
          label={t.auth.champs.email}
          id="email"
          icon={Mail}
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t.auth.champs.emailPh}
          required
          defaultValue={etat?.champs?.email}
        />

        <MessageErreur message={etat?.erreur} />

        <Button type="submit" size="lg" disabled={enCours} className="h-12 text-base shadow-lg shadow-primary/25">
          {enCours ? (
            <>
              <Loader2 className="animate-spin" /> {o.envoi}
            </>
          ) : (
            o.bouton
          )}
        </Button>
      </form>
    </div>
  )
}
