"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { HandHeart, Loader2, MailCheck, Search } from "lucide-react"

import { inscription } from "@/app/(auth)/actions"
import { Champ, ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
      <Card className="text-center">
        <CardHeader className="items-center">
          <div className="mx-auto mb-2 flex size-16 animate-in zoom-in items-center justify-center rounded-full bg-success text-success-foreground duration-500">
            <MailCheck className="size-8" />
          </div>
          <CardTitle className="font-heading text-2xl">Vérifiez vos e-mails</CardTitle>
          <CardDescription className="text-base">{etat.succes}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/connexion">Aller à la connexion</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const c = etat?.champs

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Créer mon compte</CardTitle>
        <CardDescription>
          {espace ? (
            <>
              Espace <strong className="text-primary">{espace.nom}</strong> —
              c&apos;est gratuit et rapide.
            </>
          ) : (
            "C'est gratuit et rapide."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="espace" value={espaceSlug} />
          <input type="hidden" name="type_intervenant" value={role === "intervenant" ? typeChoisi : ""} />

          {/* 1. Ce que la personne veut faire */}
          <div className="flex flex-col gap-2">
            <Label>Je veux…</Label>
            <div className="grid grid-cols-2 gap-3">
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
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-all active:scale-95",
                    role === o.valeur
                      ? "border-primary bg-primary/10 text-primary shadow-md"
                      : "border-border hover:border-primary/40 hover:bg-muted"
                  )}
                >
                  <o.icon className={cn("size-6 transition-transform", role === o.valeur && "scale-110")} />
                  {o.titre}
                </button>
              ))}
            </div>
            {role === "intervenant" && (
              <p className="animate-in fade-in text-xs text-muted-foreground">
                Votre profil sera validé par notre équipe avant de recevoir des
                demandes. Vous pourrez aussi faire des demandes.
              </p>
            )}
          </div>

          {/* 2. L'espace */}
          <div className="flex flex-col gap-2">
            <Label>
              Espace {role === "demandeur" && <span className="font-normal text-muted-foreground">(facultatif)</span>}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {ESPACES.map((e) => (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => {
                    setEspaceSlug(e.slug)
                    setType("")
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all active:scale-95",
                    espaceSlug === e.slug
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted"
                  )}
                >
                  <e.icon className="size-4 shrink-0" />
                  {e.nom}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Le rôle dans l'espace (Sofer / Rav / Rabbanit) */}
          {role === "intervenant" && espace && espace.types.length > 1 && (
            <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-2">
              <Label>Je suis…</Label>
              <div className="flex flex-wrap gap-2">
                {espace.types.map((t) => (
                  <button
                    key={t.valeur}
                    type="button"
                    onClick={() => setType(t.valeur)}
                    className={cn(
                      "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all active:scale-95",
                      type === t.valeur
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Les informations personnelles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Prénom" id="prenom" autoComplete="given-name" required defaultValue={c?.prenom} />
            <Champ label="Nom" id="nom" autoComplete="family-name" required defaultValue={c?.nom} />
          </div>
          <Champ
            label="Téléphone"
            id="telephone"
            type="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            required
            defaultValue={c?.telephone}
          />
          <Champ
            label="E-mail"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.fr"
            required
            defaultValue={c?.email}
          />
          <ChampMotDePasse autoComplete="new-password" aide="8 caractères minimum." />

          <MessageErreur message={etat?.erreur} />

          <Button type="submit" size="lg" disabled={enCours} className="h-12 text-base">
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
              className="font-medium text-primary hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
