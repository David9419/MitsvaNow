"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import type { Database } from "@/lib/database.types"
import { trouverEspace } from "@/lib/espaces"
import type { Dico } from "@/lib/i18n"
import { obtenirDico, obtenirLangue } from "@/lib/i18n/serveur"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"

export type EtatFormulaire = {
  erreur?: string
  succes?: string
  champs?: Record<string, string>
} | undefined

/** Traduit les messages d'erreur de Supabase en phrase simple, dans la langue du site. */
function traduireErreur({ message, name }: { message: string; name?: string }, t: Dico) {
  const e = t.auth.erreurs
  if (name === "AuthRetryableFetchError") return e.serveur
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) return e.identifiants
  if (m.includes("email not confirmed")) return e.confirmer
  if (m.includes("already registered") || m.includes("already been registered")) return e.existe
  if (m.includes("password should be") || m.includes("weak password")) return e.faible
  if (m.includes("rate limit") || m.includes("security purposes")) return e.tentatives
  if (m.includes("same") && m.includes("password")) return e.memeMdp
  if (m.includes("not authorized") || m.includes("error sending")) return e.smtp
  if (m.includes("fetch failed") || m.includes("network")) return e.serveur
  return e.generique
}

const texte = (formData: FormData, cle: string) =>
  String(formData.get(cle) ?? "").trim()

/** Photo envoyée par le formulaire (image JPEG déjà réduite, en « data URL »). */
function lirePhoto(formData: FormData) {
  const brut = String(formData.get("photo") ?? "")
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(brut)
  if (!m) return null
  const octets = Buffer.from(m[2], "base64")
  // 3 Mo au plus (la photo est réduite dans le navigateur, elle fait en général ~80 Ko)
  if (octets.length === 0 || octets.length > 3 * 1024 * 1024) return null
  return { octets, type: `image/${m[1]}`, extension: m[1] === "jpeg" ? "jpg" : m[1] }
}

export async function inscription(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const [t, langue] = await Promise.all([obtenirDico(), obtenirLangue()])
  const e = t.auth.erreurs
  const champs = {
    prenom: texte(formData, "prenom"),
    nom: texte(formData, "nom"),
    telephone: texte(formData, "telephone"),
    // Les e-mails ne tiennent pas compte des majuscules
    email: texte(formData, "email").toLowerCase(),
    espace: texte(formData, "espace"),
    type_intervenant: texte(formData, "type_intervenant"),
  }
  const motDePasse = String(formData.get("mot_de_passe") ?? "")
  const photo = lirePhoto(formData)

  if (!champs.prenom || !champs.nom) return { erreur: e.nomPrenom, champs }
  if (!/^[+0-9 ().-]{8,20}$/.test(champs.telephone)) return { erreur: e.telInvalide, champs }
  if (!/^\S+@\S+\.\S+$/.test(champs.email)) return { erreur: e.emailInvalide, champs }
  if (motDePasse.length < 8) return { erreur: e.mdpCourt, champs }
  if (!photo) return { erreur: e.photoRequise, champs }

  const espace = trouverEspace(champs.espace)
  if (!espace) return { erreur: e.choisirEspace, champs }
  // L'espace choisi décide du rôle : « Demandeurs » ou l'un des 4 espaces d'intervenants
  const intervenant = espace.role === "intervenant"
  if (intervenant && !espace.types.some((x) => x === champs.type_intervenant))
    return { erreur: e.precisezRole, champs }

  // Position donnée pendant l'inscription (facultative)
  const lat = Number(formData.get("lat"))
  const lng = Number(formData.get("lng"))
  const positionValide =
    formData.get("lat") !== "" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  const adresse = texte(formData, "adresse").slice(0, 300)

  const origine = (await headers()).get("origin") ?? "http://localhost:3000"
  const supabase = await createClient()
  // Si quelqu'un était déjà connecté, on le déconnecte avant de créer le nouveau compte
  await supabase.auth.signOut()
  const { data, error } = await supabase.auth.signUp({
    email: champs.email,
    password: motDePasse,
    options: {
      emailRedirectTo: `${origine}/auth/callback`,
      data: {
        prenom: champs.prenom,
        nom: champs.nom,
        telephone: champs.telephone,
        espace: espace.slug,
        langue,
        ...(intervenant ? { type_intervenant: champs.type_intervenant } : {}),
        ...(positionValide ? { lat, lng, adresse: adresse || null } : {}),
      },
    },
  })

  if (error) return { erreur: traduireErreur(error, t), champs }

  // Supabase ne signale pas les e-mails déjà utilisés : il renvoie un compte sans identité.
  if (data.user && data.user.identities?.length === 0) return { erreur: e.existe, champs }

  // Compte créé : on range la photo dans « photos/<id>/… » avec la session toute neuve
  if (data.session && data.user) {
    try {
      const client = createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      })
      const chemin = `${data.user.id}/${Date.now()}.${photo.extension}`
      const { error: e1 } = await client.storage
        .from("photos")
        .upload(chemin, photo.octets, { contentType: photo.type, upsert: false })
      if (!e1) {
        const url = client.storage.from("photos").getPublicUrl(chemin).data.publicUrl
        await client.rpc("definir_photo", { p_url: url })
      } else {
        console.error("Photo d'inscription non enregistrée", e1.message)
      }
    } catch (err) {
      // La photo pourra être ajoutée plus tard dans les paramètres
      console.error("Photo d'inscription non enregistrée", err)
    }
    redirect("/accueil")
  }

  return { succes: t.auth.succes.inscription(champs.email) }
}

export async function connexion(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const t = await obtenirDico()
  const email = texte(formData, "email").toLowerCase()
  const motDePasse = String(formData.get("mot_de_passe") ?? "")

  if (!email || !motDePasse) return { erreur: t.auth.erreurs.remplir, champs: { email } }

  const supabase = await createClient()
  // On repart de zéro : l'ancienne session est fermée avant la nouvelle connexion
  await supabase.auth.signOut()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  })

  if (error) return { erreur: traduireErreur(error, t), champs: { email } }

  redirect("/accueil")
}

export async function deconnexion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

/** « Mot de passe oublié » : envoie un e-mail avec un lien pour en choisir un nouveau. */
export async function demanderNouveauMotDePasse(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const t = await obtenirDico()
  const e = t.auth.erreurs
  const email = texte(formData, "email").toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) return { erreur: e.emailInvalide, champs: { email } }

  const origine = (await headers()).get("origin") ?? "http://localhost:3000"
  const supabase = await createClient()
  // Aucun compte avec cet e-mail : on le dit (Supabase, lui, n'enverrait rien sans prévenir)
  const { data: existe } = await supabase.rpc("email_inscrit", { p_email: email })
  if (existe === false) return { erreur: e.aucunCompte(email), champs: { email } }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origine}/auth/callback?suite=/nouveau-mot-de-passe`,
  })
  if (error) {
    console.error("Mot de passe oublié : envoi impossible", error.message)
    const m = error.message.toLowerCase()
    if (m.includes("rate limit") || m.includes("security purposes"))
      return { erreur: e.tropDemandes, champs: { email } }
    // Sinon, c'est l'envoi de l'e-mail qui a échoué (réglage SMTP dans Supabase)
    return { erreur: e.emailPasParti, champs: { email } }
  }

  return { succes: t.auth.succes.oublie(email) }
}

/** Enregistre le nouveau mot de passe (après avoir ouvert le lien reçu par e-mail). */
export async function changerMotDePasse(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const t = await obtenirDico()
  const motDePasse = String(formData.get("mot_de_passe") ?? "")
  if (motDePasse.length < 8) return { erreur: t.auth.erreurs.mdpCourt }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erreur: t.auth.erreurs.lienExpire }

  const { error } = await supabase.auth.updateUser({ password: motDePasse })
  if (error) return { erreur: traduireErreur(error, t) }

  redirect("/accueil")
}

/** Paramètres : changer son mot de passe (ancien + nouveau + confirmation). */
export async function changerMotDePasseCompte(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const t = await obtenirDico()
  const e = t.auth.erreurs
  const ancien = String(formData.get("ancien") ?? "")
  const nouveau = String(formData.get("mot_de_passe") ?? "")
  const confirmation = String(formData.get("confirmation") ?? "")

  if (nouveau.length < 8) return { erreur: e.mdpCourt }
  if (nouveau !== confirmation) return { erreur: e.confirmationDiff }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { erreur: e.generique }

  // On vérifie l'ancien mot de passe avant de le remplacer
  const { error: verif } = await supabase.auth.signInWithPassword({ email: user.email, password: ancien })
  if (verif) {
    const m = verif.message.toLowerCase()
    return { erreur: m.includes("invalid login credentials") ? e.ancienFaux : traduireErreur(verif, t) }
  }
  if (ancien === nouveau) return { erreur: e.memeMdp }

  const { error } = await supabase.auth.updateUser({ password: nouveau })
  if (error) return { erreur: traduireErreur(error, t) }

  return { succes: t.auth.succes.mdpChange }
}
