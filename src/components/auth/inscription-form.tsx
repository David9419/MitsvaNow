"use client"

import Link from "next/link"
import { startTransition, useActionState, useRef, useState } from "react"
import {
  Camera,
  Check,
  ImageUp,
  Keyboard,
  Loader2,
  LocateFixed,
  Mail,
  MailCheck,
  MapPin,
  Phone,
  User,
} from "lucide-react"

import { inscription } from "@/app/(auth)/actions"
import { Champ, ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { RechercheAdresse } from "@/components/tableau/recherche-adresse"
import { Button } from "@/components/ui/button"
import { ESPACES, ESPACES_SERVICES, trouverEspace } from "@/lib/espaces"
import { blobEnDataUrl, compresserPhoto } from "@/lib/photo"
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
  const t = useT()
  const langue = useLangue()
  const ti = t.auth.inscription
  const [etat, action, enCours] = useActionState(inscription, undefined)
  const fixe = trouverEspace(espaceFixe)
  const [espaceSlug, setEspaceSlug] = useState<string>(fixe?.slug ?? "")
  const [type, setType] = useState("")

  const espace = trouverEspace(espaceSlug)
  const intervenant = espace?.role === "intervenant"

  // ---------- Photo du visage (facultative) ----------
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoEnCours, setPhotoEnCours] = useState(false)
  const [erreurLocale, setErreurLocale] = useState<string | null>(null)
  const galerie = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const blocPhoto = useRef<HTMLDivElement>(null)

  const choisirPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setPhotoEnCours(true)
    try {
      setPhoto(await blobEnDataUrl(await compresserPhoto(f)))
      setErreurLocale(null)
    } catch {
      setErreurLocale(t.parametres.photoTropLourde)
    } finally {
      setPhotoEnCours(false)
    }
  }

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
          const l = { lat: p.coords.latitude, lng: p.coords.longitude, adresse: await adresseDePosition(p.coords.latitude, p.coords.longitude, langue) }
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
    setErreurLocale(null)
    let l = lieu
    if (!l && etatLoc !== "refusee" && etatLoc !== "saisie") l = await localiser()
    const donnees = new FormData(formulaire)
    donnees.set("photo", photo ?? "")
    donnees.set("lat", l ? String(l.lat) : "")
    donnees.set("lng", l ? String(l.lng) : "")
    donnees.set("adresse", l?.adresse ?? "")
    startTransition(() => action(donnees))
  }
  // Un seul rôle possible dans l'espace : on le choisit automatiquement
  const typeChoisi = espace?.types.length === 1 ? espace.types[0] : type

  if (etat?.succes) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 animate-in zoom-in items-center justify-center rounded-full bg-success text-success-foreground duration-500">
          <MailCheck className="size-8" />
        </div>
        <h1 className="text-2xl font-bold">{ti.verifierEmails}</h1>
        <p className="mt-3 text-muted-foreground">{etat.succes}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/connexion">{ti.allerConnexion}</Link>
        </Button>
      </div>
    )
  }

  const c = etat?.champs
  const listeEspaces = choix === "intervenants" ? ESPACES_SERVICES : ESPACES
  // Numéros des étapes : sans liste d'espaces, on commence directement par les informations
  const n = fixe ? 0 : 1
  const nomFixe = fixe ? t.espaces[fixe.slug].nom : ""

  return (
    <div>
      <div className="mb-8">
        {fixe && (
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            <fixe.icon className="size-4" /> {t.tableau.espace(nomFixe)}
          </span>
        )}
        <h1 className="text-3xl font-bold tracking-tight">
          {fixe?.role === "demandeur" ? ti.titreDemande : ti.titre}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {!fixe
            ? choix === "intervenants"
              ? ti.texteIntervenants
              : ti.texteTous
            : fixe.role === "demandeur"
              ? ti.texteDemandeur
              : ti.texteEspace(nomFixe)}
        </p>
      </div>

      <form onSubmit={envoyer} className="flex flex-col gap-7">
        <input type="hidden" name="espace" value={espaceSlug} />
        <input type="hidden" name="type_intervenant" value={intervenant ? typeChoisi : ""} />

        {/* 1. L'espace (seulement si on ne le connaît pas déjà) */}
        {!fixe && (
          <div role="group" className="flex flex-col gap-3">
            <p className="text-sm font-semibold">1. {ti.choisirEspace}</p>
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
                      "relative flex items-start gap-2 rounded-xl border-2 bg-card p-3.5 text-start text-sm font-semibold transition-all duration-200 active:scale-95",
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
                        {t.espaces[e.slug].nom}
                        <span className="block text-xs font-normal text-muted-foreground">{ti.besoin}</span>
                      </span>
                    ) : (
                      <span className="pe-5">{t.espaces[e.slug].nom}</span>
                    )}
                    {actif && (
                      <span className="absolute end-2.5 top-2.5 flex size-5 animate-in zoom-in items-center justify-center rounded-full bg-primary text-primary-foreground duration-300">
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
                <span className="text-sm font-semibold">{ti.jeSuis}</span>
                {espace.types.map((valeur) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => setType(valeur)}
                    aria-pressed={type === valeur}
                    className={cn(
                      "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all active:scale-95",
                      type === valeur
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    {t.types[valeur]}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{ti.rappel}</p>
          </div>
        )}

        {/* Les informations personnelles */}
        <div role="group" className="flex flex-col gap-4">
          <p className="text-sm font-semibold">
            {n + 1}. {ti.infos}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label={t.auth.champs.prenom} id="prenom" icon={User} autoComplete="given-name" placeholder={t.auth.champs.prenomPh} required defaultValue={c?.prenom} />
            <Champ label={t.auth.champs.nom} id="nom" icon={User} autoComplete="family-name" placeholder={t.auth.champs.nomPh} required defaultValue={c?.nom} />
          </div>
          <Champ label={t.auth.champs.email} id="email" icon={Mail} type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={t.auth.champs.emailPh} required defaultValue={c?.email} />
          <Champ label={t.auth.champs.tel} id="telephone" icon={Phone} type="tel" autoComplete="tel" placeholder={t.auth.champs.telPh} required defaultValue={c?.telephone} />
          <ChampMotDePasse autoComplete="new-password" aide={t.auth.champs.mdpAide} />
        </div>

        {/* La photo du visage */}
        <div ref={blocPhoto} role="group" className="flex scroll-mt-24 flex-col gap-3">
          <p className="text-sm font-semibold">
            {n + 2}. {ti.photo}
          </p>
          <div
            className={cn(
              "flex items-center gap-4 rounded-2xl border p-4 transition-colors",
              photo ? "border-success/40 bg-success/5" : "border-dashed bg-card",
              erreurLocale && !photo && "border-destructive/60 bg-destructive/5"
            )}
          >
            <span
              className={cn(
                "relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full",
                photo ? "ring-4 ring-success/30" : "border-2 border-dashed border-primary/40 bg-primary/5 text-primary"
              )}
            >
              {photoEnCours ? (
                <Loader2 className="size-6 animate-spin" />
              ) : photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu local de la photo choisie
                <img src={photo} alt="" className="size-full animate-in zoom-in-95 object-cover" />
              ) : (
                <Camera className="size-7" />
              )}
              {photo && (
                <span className="absolute end-0 bottom-0 flex size-6 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-card">
                  <Check className="size-3.5" />
                </span>
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-sm text-muted-foreground">{photo ? ti.photoPrete : ti.photoTexte}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={photo ? "outline" : "default"} onClick={() => galerie.current?.click()} disabled={photoEnCours}>
                  <ImageUp /> {ti.choisirPhoto}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => camera.current?.click()} disabled={photoEnCours}>
                  <Camera /> {ti.prendrePhoto}
                </Button>
              </div>
            </div>
          </div>
          <input ref={galerie} type="file" accept="image/*" className="hidden" onChange={choisirPhoto} />
          <input ref={camera} type="file" accept="image/*" capture="user" className="hidden" onChange={choisirPhoto} />
        </div>

        {/* La localisation */}
        <div role="group" className="flex flex-col gap-3">
          <p className="text-sm font-semibold">
            {n + 3}. {ti.position}
          </p>
          {lieu ? (
            <div className="flex animate-in fade-in items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
              <span className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Check className="size-4" />
                </span>
                <span>
                  <span className="block font-semibold">{ti.locActivee}</span>
                  <span className="text-muted-foreground">{lieu.adresse ?? ti.positionTrouvee}</span>
                </span>
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setLieu(null); setEtatLoc("saisie") }}>
                {t.commun.modifier}
              </Button>
            </div>
          ) : etatLoc === "saisie" ? (
            <div className="animate-in fade-in flex flex-col gap-2">
              <RechercheAdresse onChoisir={(s) => setLieu({ lat: s.lat, lng: s.lng, adresse: s.libelle })} />
              <button type="button" onClick={localiser} className="self-start text-xs text-primary hover:underline">
                {ti.utiliserAuto}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-card p-4">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {etatLoc === "refusee" ? ti.locRefusee : intervenant ? ti.pourIntervenant : ti.pourDemandeur}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={localiser} disabled={etatLoc === "recherche"}>
                  {etatLoc === "recherche" ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                  {etatLoc === "recherche" ? ti.localisation : ti.activerLoc}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEtatLoc("saisie")}>
                  <Keyboard /> {ti.taperAdresse}
                </Button>
              </div>
            </div>
          )}
        </div>

        <MessageErreur message={erreurLocale ?? etat?.erreur} />

        <Button type="submit" size="lg" disabled={enCours || etatLoc === "recherche" || photoEnCours} className="h-12 text-base shadow-lg shadow-primary/25">
          {enCours || etatLoc === "recherche" ? (
            <>
              <Loader2 className="animate-spin" /> {etatLoc === "recherche" ? ti.localisation : ti.creation}
            </>
          ) : (
            ti.bouton
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {ti.dejaInscrit}{" "}
          <Link
            href={espaceSlug ? `/connexion?espace=${espaceSlug}` : "/connexion"}
            className="font-semibold text-primary hover:underline"
          >
            {t.commun.seConnecter}
          </Link>
        </p>
      </form>
    </div>
  )
}
