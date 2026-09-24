"use client"

import Link from "next/link"
import { startTransition, useActionState, useState } from "react"
import { Check, Keyboard, Loader2, LocateFixed, Mail, MailCheck, MapPin, Phone, User } from "lucide-react"

import { inscription } from "@/app/(auth)/actions"
import { Champ, ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { RechercheAdresse } from "@/components/tableau/recherche-adresse"
import { Button } from "@/components/ui/button"
import { ESPACES, ESPACES_SERVICES, trouverEspace } from "@/lib/espaces"
import { adresseDePosition } from "@/lib/tableau/adresses"
import { cn } from "@/lib/utils"

/**
 * Formulaire d'inscription.
 * - espaceFixe : on vient du bouton d'un espace → l'espace est déjà choisi, pas de liste
 * - choix : sinon, la liste des espaces proposés (les 4 d'intervenants, ou les 5)
 */
export function InscriptionForm({
  espaceFixe,
  choix = "tous",
}: {
  espaceFixe?: string
  choix?: "intervenants" | "tous"
}) {
  const [etat, action, enCours] = useActionState(inscription, undefined)
  const fixe = trouverEspace(espaceFixe)
  const [espaceSlug, setEspaceSlug] = useState(fixe?.slug ?? "")
  const [type, setType] = useState("")

  const espace = trouverEspace(espaceSlug)
  const intervenant = espace?.role === "intervenant"

  // ---------- Localisation pendant l'inscription ----------
  type Lieu = { lat: number; lng: number; adresse: string | null }
  const [lieu, setLieu] = useState<Lieu | null>(null)
  const [etatLoc, setEtatLoc] = useState<"attente" | "recherche" | "refusee" | "saisie">("attente")

  const localiser = () =>
    new Promise<Lieu | null>((resolve) => {
      if (!navigator.geolocation) {
        setEtatLoc("refusee")
        return resolve(null)
      }
      setEtatLoc("recherche")
      navigator.geolocation.getCurrentPosition(
        async (p) => {
          const l = { lat: p.coords.latitude, lng: p.coords.longitude, adresse: await adresseDePosition(p.coords.latitude, p.coords.longitude) }
          setLieu(l)
          setEtatLoc("attente")
          resolve(l)
        },
        () => {
          setEtatLoc("refusee")
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 15000 }
      )
    })

  // À l'envoi : si la position n'est pas encore connue, on la demande d'abord
  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formulaire = e.currentTarget
    let l = lieu
    if (!l && etatLoc !== "refusee" && etatLoc !== "saisie") l = await localiser()
    const donnees = new FormData(formulaire)
    donnees.set("lat", l ? String(l.lat) : "")
    donnees.set("lng", l ? String(l.lng) : "")
    donnees.set("adresse", l?.adresse ?? "")
    startTransition(() => action(donnees))
  }
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
  const listeEspaces = choix === "intervenants" ? ESPACES_SERVICES : ESPACES
  // Numéros des étapes : sans liste d'espaces, on commence directement par les informations
  const n = fixe ? 0 : 1

  return (
    <div>
      <div className="mb-8">
        {fixe && (
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            <fixe.icon className="size-4" /> Espace {fixe.nom}
          </span>
        )}
        <h1 className="text-3xl font-bold tracking-tight">
          {fixe?.role === "demandeur" ? "Faire une demande" : "Créer un compte"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {!fixe
            ? choix === "intervenants"
              ? "Choisissez l'espace dans lequel vous voulez aider."
              : "Rejoignez Mivtsa Now en moins d'une minute."
            : fixe.role === "demandeur"
              ? "Créez votre compte en moins d'une minute pour envoyer votre demande."
              : `Rejoignez l'espace ${fixe.nom} et recevez les demandes près de chez vous.`}
        </p>
      </div>

      <form onSubmit={envoyer} className="flex flex-col gap-6">
        <input type="hidden" name="espace" value={espaceSlug} />
        <input type="hidden" name="type_intervenant" value={intervenant ? typeChoisi : ""} />

        {/* 1. L'espace (seulement si on ne le connaît pas déjà) */}
        {!fixe && (
        <div role="group" className="flex flex-col gap-3">
          <p className="text-sm font-semibold">1. Choisissez votre espace</p>
          <div className="grid grid-cols-2 gap-3">
            {listeEspaces.map((e) => {
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
        )}

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
              Dès votre compte créé, passez en « Disponible » : vous recevrez
              les demandes des personnes proches de vous.
            </p>
          </div>
        )}

        {/* 3. Les informations personnelles */}
        <div role="group" className="flex flex-col gap-4">
          <p className="text-sm font-semibold">{n + 1}. Vos informations</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Prénom" id="prenom" icon={User} autoComplete="given-name" placeholder="David" required defaultValue={c?.prenom} />
            <Champ label="Nom" id="nom" icon={User} autoComplete="family-name" placeholder="Cohen" required defaultValue={c?.nom} />
          </div>
          <Champ label="E-mail" id="email" icon={Mail} type="email" autoComplete="email" placeholder="vous@exemple.fr" required defaultValue={c?.email} />
          <Champ label="Téléphone" id="telephone" icon={Phone} type="tel" autoComplete="tel" placeholder="06 12 34 56 78" required defaultValue={c?.telephone} />
          <ChampMotDePasse autoComplete="new-password" aide="8 caractères minimum." />
        </div>

        {/* 3. La localisation */}
        <div role="group" className="flex flex-col gap-3">
          <p className="text-sm font-semibold">{n + 2}. Votre position</p>
          {lieu ? (
            <div className="flex animate-in fade-in items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
              <span className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Check className="size-4" />
                </span>
                <span>
                  <span className="block font-semibold">Localisation activée</span>
                  <span className="text-muted-foreground">{lieu.adresse ?? "Position trouvée"}</span>
                </span>
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setLieu(null); setEtatLoc("saisie") }}>
                Modifier
              </Button>
            </div>
          ) : etatLoc === "saisie" ? (
            <div className="animate-in fade-in flex flex-col gap-2">
              <RechercheAdresse onChoisir={(s) => setLieu({ lat: s.lat, lng: s.lng, adresse: s.libelle })} />
              <button type="button" onClick={localiser} className="self-start text-xs text-primary hover:underline">
                Utiliser plutôt la localisation automatique
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-card p-4">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {etatLoc === "refusee"
                  ? "La localisation automatique n'est pas autorisée. Tapez votre adresse, ou continuez : vous pourrez l'indiquer plus tard."
                  : intervenant
                    ? "Pour recevoir les demandes des personnes proches de vous."
                    : "Pour trouver l'intervenant le plus proche de chez vous."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={localiser} disabled={etatLoc === "recherche"}>
                  {etatLoc === "recherche" ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                  {etatLoc === "recherche" ? "Localisation…" : "Activer ma localisation"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEtatLoc("saisie")}>
                  <Keyboard /> Taper mon adresse
                </Button>
              </div>
            </div>
          )}
        </div>

        <MessageErreur message={etat?.erreur} />

        <Button type="submit" size="lg" disabled={enCours || etatLoc === "recherche"} className="h-12 text-base shadow-lg shadow-primary/25">
          {enCours || etatLoc === "recherche" ? (
            <>
              <Loader2 className="animate-spin" /> {etatLoc === "recherche" ? "Localisation…" : "Création du compte…"}
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
