"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { Check, HandHeart, Loader2, Mail, MailCheck, Phone, Search, User } from "lucide-react"

import { inscription } from "@/app/(auth)/actions"
import { Champ, ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { Button } from "@/components/ui/button"
import { ESPACES, trouverEspace } from "@/lib/espaces"
import { cn } from "@/lib/utils"

type Role = "demandeur" | "intervenant"

export function InscriptionForm({
  espaceInitial,
  roleInitial,
}: {
  espaceInitial?: string
  roleInitial?: Role
}) {
  const [etat, action, enCours] = useActionState(inscription, undefined)
  const [role, setRole] = useState<Role>(roleInitial ?? "demandeur")
  const [espaceSlug, setEspaceSlug] = useState(trouverEspace(espaceInitial)?.slug ?? "")
  const [type, setType] = useState("")

  const espace = trouverEspace(espaceSlug)
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
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="espace" value={espaceSlug} />
        <input type="hidden" name="type_intervenant" value={role === "intervenant" ? typeChoisi : ""} />

        {/* 1. L'espace */}
        <div role="group" className="flex flex-col gap-3">
          <p className="text-sm font-semibold">1. Choisissez votre espace</p>
          <div className="grid grid-cols-2 gap-3">
            {ESPACES.map((e) => {
              const actif = espaceSlug === e.slug
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
                    "relative flex flex-col items-start gap-2 rounded-xl border-2 bg-card p-3.5 text-left text-sm font-semibold transition-all duration-200 active:scale-95",
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
                  {e.nom}
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

        {/* 2. Ce que la personne veut faire */}
        <div role="group" className="flex flex-col gap-3">
          <p className="text-sm font-semibold">2. Je veux…</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(
              [
                { valeur: "demandeur", titre: "Faire une demande", icon: Search },
                { valeur: "intervenant", titre: "Devenir intervenant", icon: HandHeart },
              ] as const
            ).map((o) => (
              <button
                key={o.valeur}
                type="button"
                onClick={() => setRole(o.valeur)}
                aria-pressed={role === o.valeur}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-300",
                  role === o.valeur
                    ? "bg-card text-primary shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <o.icon className="size-4" />
                {o.titre}
              </button>
            ))}
          </div>

          {role === "intervenant" && espace && espace.types.length > 1 && (
            <div className="animate-in fade-in slide-in-from-top-2 flex flex-wrap items-center gap-2 duration-300">
              <span className="text-sm text-muted-foreground">Je suis :</span>
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
          {role === "intervenant" && (
            <p className="animate-in fade-in text-xs text-muted-foreground duration-300">
              Votre profil sera validé par notre équipe avant de recevoir des
              demandes. Vous pourrez aussi faire des demandes.
            </p>
          )}
        </div>

        {/* 3. Les informations personnelles */}
        <div role="group" className="flex flex-col gap-4">
          <p className="text-sm font-semibold">3. Vos informations</p>
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
