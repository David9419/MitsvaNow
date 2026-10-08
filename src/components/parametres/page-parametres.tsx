"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  BellRing,
  KeyRound,
  Languages,
  Loader2,
  Lock,
  Mail,
  Moon,
  Palette,
  Phone,
  Save,
  Send,
  Settings,
  Sun,
  User,
  type LucideIcon,
} from "lucide-react"

import { changerMotDePasseCompte } from "@/app/(auth)/actions"
import { Champ, ChampMotDePasse, MessageErreur } from "@/components/auth/champ"
import { ChoixPhoto } from "@/components/choix-photo"
import { useT } from "@/components/i18n/langue-provider"
import { InterrupteurTheme } from "@/components/mode-toggle"
import { ChoixLangue } from "@/components/selecteur-langue"
import { BarreTableau } from "@/components/tableau/barre-tableau"
import { EtapesEcranAccueil } from "@/components/tableau/carte-notifications"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { usePush } from "@/hooks/use-push"
import { createClient } from "@/lib/supabase/client"
import { compresserPhoto } from "@/lib/photo"
import { messageErreur } from "@/lib/tableau/outils"

type Profil = { prenom: string; nom: string; telephone: string; email: string; photo: string | null }

/** Une ligne « réglage » : icône, titre, petit texte, et l'interrupteur à droite. */
function Reglage({
  icon: Icon,
  titre,
  texte,
  children,
}: {
  icon: LucideIcon
  titre: string
  texte: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{titre}</p>
        <p className="text-sm text-muted-foreground">{texte}</p>
      </div>
      {children}
    </div>
  )
}

export function PageParametres({ utilisateurId, profil }: { utilisateurId: string; profil: Profil }) {
  const t = useT()
  const p = t.parametres
  const router = useRouter()
  const supabase = useRef(createClient()).current
  const push = usePush()
  const { resolvedTheme } = useTheme()
  const [monte, setMonte] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- le thème n'est connu qu'une fois la page affichée
    setMonte(true)
  }, [])

  // ---------- Photo ----------
  const [photo, setPhoto] = useState(profil.photo)
  const [photoEnCours, setPhotoEnCours] = useState(false)
  const changerPhoto = async (fichier: File) => {
    setPhotoEnCours(true)
    try {
      const image = await compresserPhoto(fichier)
      const chemin = `${utilisateurId}/${Date.now()}.jpg`
      const { error } = await supabase.storage.from("photos").upload(chemin, image, { contentType: "image/jpeg" })
      if (error) throw error
      const url = supabase.storage.from("photos").getPublicUrl(chemin).data.publicUrl
      const { error: e2 } = await supabase.rpc("definir_photo", { p_url: url })
      if (e2) throw e2
      // L'ancienne photo n'est plus utile
      const ancienne = photo?.split("/storage/v1/object/public/photos/")[1]
      if (ancienne?.startsWith(`${utilisateurId}/`)) await supabase.storage.from("photos").remove([ancienne])
      setPhoto(url)
      toast.success(p.photoMaj)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error && e.message === "photo" ? p.photoTropLourde : messageErreur(e, t))
    } finally {
      setPhotoEnCours(false)
    }
  }

  const supprimerPhoto = async () => {
    setPhotoEnCours(true)
    try {
      // Une adresse vide (null) retire la photo du profil
      const { error } = await supabase.rpc("definir_photo", { p_url: null as unknown as string })
      if (error) throw error
      const ancienne = photo?.split("/storage/v1/object/public/photos/")[1]
      if (ancienne?.startsWith(`${utilisateurId}/`)) await supabase.storage.from("photos").remove([ancienne])
      setPhoto(null)
      toast.success(p.photoSupprimee)
      router.refresh()
    } catch (e) {
      toast.error(messageErreur(e, t))
    } finally {
      setPhotoEnCours(false)
    }
  }

  // ---------- Prénom, nom, téléphone ----------
  const [champs, setChamps] = useState({ prenom: profil.prenom, nom: profil.nom, telephone: profil.telephone })
  const [erreurProfil, setErreurProfil] = useState<string>()
  const [enregistrement, setEnregistrement] = useState(false)
  const modifie =
    champs.prenom !== profil.prenom || champs.nom !== profil.nom || champs.telephone !== profil.telephone
  const enregistrerProfil = async (e: React.FormEvent) => {
    e.preventDefault()
    const valeurs = { prenom: champs.prenom.trim(), nom: champs.nom.trim(), telephone: champs.telephone.trim() }
    if (!valeurs.prenom || !valeurs.nom) return setErreurProfil(t.auth.erreurs.nomPrenom)
    if (!/^[+0-9 ().-]{8,20}$/.test(valeurs.telephone)) return setErreurProfil(t.auth.erreurs.telInvalide)
    setErreurProfil(undefined)
    setEnregistrement(true)
    const { error } = await supabase.from("profiles").update(valeurs).eq("id", utilisateurId)
    setEnregistrement(false)
    if (error) return setErreurProfil(messageErreur(error, t))
    toast.success(p.profilMaj)
    router.refresh()
  }

  // ---------- Mot de passe ----------
  const [etatMdp, actionMdp, mdpEnCours] = useActionState(changerMotDePasseCompte, undefined)
  const formulaireMdp = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (etatMdp?.succes) {
      toast.success(etatMdp.succes)
      formulaireMdp.current?.reset()
    }
  }, [etatMdp])

  const sombre = monte && resolvedTheme === "dark"
  const notifsActives = push.etat === "actif"

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <BarreTableau icon={Settings} espace={p.titre} retour="/accueil" libelleRetour={p.retour} parametres={false} />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-3xl font-bold tracking-tight">{p.titre}</h1>
        <p className="mt-1 text-muted-foreground">{p.sousTitre}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* ---------- Colonne 1 : profil + mot de passe ---------- */}
        <div className="flex flex-col gap-6">
          <CarteWidget icon={User} titre={p.profil} sousTitre={p.profilSous} delai={100}>
            <div className="mb-6 flex items-center gap-5">
              <ChoixPhoto
                src={photo}
                nom={champs.prenom}
                onFichier={changerPhoto}
                onSupprimer={supprimerPhoto}
                enCours={photoEnCours}
                libelles={{ changer: p.changerPhoto, choisir: p.choisir, prendre: p.prendre, supprimer: p.supprimer }}
              />
              <div className="min-w-0">
                <p className="truncate font-heading text-xl font-bold">
                  {champs.prenom} {champs.nom}
                </p>
                <p className="truncate text-sm text-muted-foreground">{profil.email}</p>
              </div>
            </div>

            <form onSubmit={enregistrerProfil} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Champ
                  label={t.auth.champs.prenom}
                  id="prenom"
                  icon={User}
                  autoComplete="given-name"
                  value={champs.prenom}
                  onChange={(e) => setChamps((c) => ({ ...c, prenom: e.target.value }))}
                  required
                />
                <Champ
                  label={t.auth.champs.nom}
                  id="nom"
                  icon={User}
                  autoComplete="family-name"
                  value={champs.nom}
                  onChange={(e) => setChamps((c) => ({ ...c, nom: e.target.value }))}
                  required
                />
              </div>
              <Champ
                label={t.auth.champs.tel}
                id="telephone"
                icon={Phone}
                type="tel"
                autoComplete="tel"
                value={champs.telephone}
                onChange={(e) => setChamps((c) => ({ ...c, telephone: e.target.value }))}
                required
              />
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{p.email}</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" value={profil.email} readOnly disabled className="h-12 bg-muted/60 ps-10 pe-10" />
                  <Lock className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{p.emailFixe}</p>
              </div>
              <MessageErreur message={erreurProfil} />
              <Button type="submit" disabled={!modifie || enregistrement} className="self-end">
                {enregistrement ? <Loader2 className="animate-spin" /> : <Save />}
                {enregistrement ? t.commun.enregistrement : t.commun.enregistrer}
              </Button>
            </form>
          </CarteWidget>

          <CarteWidget icon={KeyRound} titre={p.securite} sousTitre={p.securiteSous} delai={250}>
            <form ref={formulaireMdp} action={actionMdp} className="flex flex-col gap-4">
              {/* Aide les gestionnaires de mots de passe à reconnaître le compte */}
              <input type="email" name="email" autoComplete="username" value={profil.email} readOnly hidden />
              <ChampMotDePasse nom="ancien" label={p.ancien} autoComplete="current-password" />
              <ChampMotDePasse nom="mot_de_passe" label={p.nouveau} autoComplete="new-password" aide={t.auth.champs.mdpAide} />
              <ChampMotDePasse nom="confirmation" label={p.confirmation} autoComplete="new-password" />
              <MessageErreur message={etatMdp?.erreur} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href="/mot-de-passe-oublie" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  {p.oublie}
                </Link>
                <Button type="submit" disabled={mdpEnCours}>
                  {mdpEnCours ? <Loader2 className="animate-spin" /> : <KeyRound />}
                  {p.changer}
                </Button>
              </div>
            </form>
          </CarteWidget>
        </div>

        {/* ---------- Colonne 2 : notifications + apparence + langue ---------- */}
        <div className="flex flex-col gap-6">
          <CarteWidget icon={BellRing} titre={p.notifs} sousTitre={p.notifsSous} delai={175}>
            <Reglage
              icon={BellRing}
              titre={p.notifsLabel}
              texte={
                push.etat === "refuse"
                  ? t.notifications.bloqueesTitre
                  : push.etat === "non-supporte"
                    ? t.notifications.nonSupporte
                    : notifsActives
                      ? p.notifsActives
                      : p.notifsInactives
              }
            >
              {push.etat === "chargement" ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  checked={notifsActives}
                  disabled={push.etat === "non-supporte"}
                  onCheckedChange={(v) => (v ? push.activer() : push.desactiver())}
                  aria-label={p.notifsLabel}
                />
              )}
            </Reglage>
            {push.etat === "ecran-accueil" && (
              <div className="mt-3 animate-in fade-in rounded-xl border bg-muted/40 p-4">
                <p className="mb-3 text-sm font-semibold">{t.notifications.iphone}</p>
                <EtapesEcranAccueil />
              </div>
            )}
            {push.etat === "refuse" && (
              <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{t.notifications.refuse}</p>
            )}
            {notifsActives && (
              <Button variant="outline" size="sm" onClick={push.tester} className="mt-3 self-start">
                <Send className="rtl:-scale-x-100" /> {t.notifications.tester}
              </Button>
            )}
          </CarteWidget>

          <CarteWidget icon={Palette} titre={p.apparence} sousTitre={p.apparenceSous} delai={325}>
            <div className="flex flex-col gap-4">
              <Reglage icon={sombre ? Moon : Sun} titre={p.modeSombre} texte={p.modeSombreTexte}>
                <InterrupteurTheme />
              </Reglage>
              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Languages className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{p.langue}</p>
                    <p className="text-sm text-muted-foreground">{p.langueTexte}</p>
                  </div>
                </div>
                <ChoixLangue />
              </div>
            </div>
          </CarteWidget>
        </div>
      </div>
    </main>
  )
}
