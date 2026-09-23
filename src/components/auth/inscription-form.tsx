"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { Check, Loader2, Mail, MailCheck, Phone, User } from "lucide-react"

import { inscription } from "@/app/(auth)/actions"
import { Champ, ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { Button } from "@/components/ui/button"
import { ESPACES, trouverEspace } from "@/lib/espaces"
import { cn } from "@/lib/utils"

export function InscriptionForm({ espaceInitial }: { espaceInitial?: string }) {
  const [etat, action, enCours] = useActionState(inscription, undefined)
  const [espaceSlug, setEspaceSlug] = useState(trouverEspace(espaceInitial)?.slug ?? "")
  const [type, setType] = useState("")

  const espace = trouverEspace(espaceSlug)
  const intervenant = espace?.role === "intervenant"
  // Un seul rôle possible dans l'espace : on le choisit automatiquement
  const typeChoisi = espace?.types.length === 1 ? espace.types[0].valeur : type

  if (etat?.succes) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 animate-in zoom-in items-center justify-center rounded-full bg-success text-success-foreground duration-500">
          <MailCheck className="size-8" />
        </div>
        <h1 className="text-2xl font-bold">Vérifiez vos e-mails</h1>
        <p className="mt-3 text-muted-foreground">{etat.succes}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/connexion">Aller à la connexion</Link>
        </Button>
      </div>
    )
  }

  const c = etat?.champs

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Créer un compte</h1>
        <p className="mt-2 text-muted-foreground">
          Rejoignez Mivtsa Now en moins d&apos;une minute.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-6">
        <input type="hidden" name="espace" value={espaceSlug} />
        <input type="hidden" name="type_intervenant" value={intervenant ? typeChoisi : ""} />

        {/* 1. L'espace */}
        <div role="group" className="flex flex-col gap-3">
          <p className="text-sm font-semibold">1. Choisissez votre espace</p>
          <div className="grid grid-cols-2 gap-3">
            {ESPACES.map((e) => {
              const actif = espaceSlug === e.slug
              const large = e.role === "demandeur"
              return (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => {
                    setEspaceSlug(e.slug)
                    setType("")
                  }}
                  aria-pressed={actif}
                  className={cn(
                    "relative flex items-start gap-2 rounded-xl border-2 bg-card p-3.5 text-left text-sm font-semibold transition-all duration-200 active:scale-95",
                    large ? "col-span-2 flex-row items-center gap-3" : "flex-col",
                    actif
                      ? "border-primary shadow-lg shadow-primary/15"
                      : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg transition-colors",
                      actif ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    )}
                  >
                    <e.icon className="size-5" />
                  </span>
                  {large ? (
                    <span>
                      {e.nom}
                      <span className="block text-xs font-normal text-muted-foreground">
                        J&apos;ai besoin de quelque chose
                      </span>
                    </span>
                  ) : (
                    e.nom
                  )}
                  {actif && (
                    <span className="absolute top-2.5 right-2.5 flex size-5 animate-in zoom-in items-center justify-center rounded-full bg-primary text-primary-foreground duration-300">
                      <Check className="size-3" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Précision du rôle (Sofer / Rav / Rabbanit) + rappel pour les intervenants */}
        {intervenant && (
          <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-3 rounded-xl border border-dashed bg-muted/40 p-4 duration-300">
            {espace && espace.types.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Je suis :</span>
                {espace.types.map((t) => (
                  <button
                    key={t.valeur}
                    type="button"
                    onClick={() => setType(t.valeur)}
                    aria-pressed={type === t.valeur}
                    className={cn(
                      "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all active:scale-95",
                      type === t.valeur
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Vous vous inscrivez comme intervenant. Votre profil sera validé
              par notre équipe avant de recevoir des demandes.
            </p>
          </div>
        )}

        {/* 3. Les informations personnelles */}
        <div role="group" className="flex flex-col gap-4">
          <p className="text-sm font-semibold">2. Vos informations</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Prénom" id="prenom" icon={User} autoComplete="given-name" placeholder="David" required defaultValue={c?.prenom} />
            <Champ label="Nom" id="nom" icon={User} autoComplete="family-name" placeholder="Cohen" required defaultValue={c?.nom} />
          </div>
          <Champ label="E-mail" id="email" icon={Mail} type="email" autoComplete="email" placeholder="vous@exemple.fr" required defaultValue={c?.email} />
          <Champ label="Téléphone" id="telephone" icon={Phone} type="tel" autoComplete="tel" placeholder="06 12 34 56 78" required defaultValue={c?.telephone} />
          <ChampMotDePasse autoComplete="new-password" aide="8 caractères minimum." />
        </div>

        <MessageErreur message={etat?.erreur} />

        <Button type="submit" size="lg" disabled={enCours} className="h-12 text-base shadow-lg shadow-primary/25">
          {enCours ? (
            <>
              <Loader2 className="animate-spin" /> Création du compte…
            </>
          ) : (
            "Créer mon compte"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link
            href={espaceSlug ? `/connexion?espace=${espaceSlug}` : "/connexion"}
            className="font-semibold text-primary hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  )
}
