"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { trouverEspace } from "@/lib/espaces"

export type EtatFormulaire = {
  erreur?: string
  succes?: string
  champs?: Record<string, string>
} | undefined

/** Traduit les messages d'erreur de Supabase en français simple. */
function traduireErreur({ message, name }: { message: string; name?: string }) {
  if (name === "AuthRetryableFetchError")
    return "Impossible de joindre le serveur. Vérifiez votre connexion internet et le fichier .env.local."
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials"))
    return "E-mail ou mot de passe incorrect."
  if (m.includes("email not confirmed"))
    return "Vous devez d'abord confirmer votre adresse e-mail : ouvrez le lien reçu par e-mail."
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet e-mail. Essayez plutôt de vous connecter."
  if (m.includes("password should be") || m.includes("weak password"))
    return "Mot de passe trop faible : 8 caractères minimum."
  if (m.includes("rate limit"))
    return "Trop de tentatives. Réessayez dans quelques minutes."
  if (m.includes("not authorized"))
    return "Cette adresse e-mail ne peut pas recevoir l'e-mail de confirmation. (Réglage Supabase à faire : voir les instructions.)"
  if (m.includes("fetch failed") || m.includes("network"))
    return "Impossible de joindre le serveur. Vérifiez votre connexion internet et le fichier .env.local."
  return "Une erreur est survenue. Réessayez."
}

const texte = (formData: FormData, cle: string) =>
  String(formData.get(cle) ?? "").trim()

export async function inscription(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const champs = {
    prenom: texte(formData, "prenom"),
    nom: texte(formData, "nom"),
    telephone: texte(formData, "telephone"),
    email: texte(formData, "email"),
    role: texte(formData, "role"),
    espace: texte(formData, "espace"),
    type_intervenant: texte(formData, "type_intervenant"),
  }
  const motDePasse = String(formData.get("mot_de_passe") ?? "")

  if (!champs.prenom || !champs.nom)
    return { erreur: "Merci d'indiquer votre prénom et votre nom.", champs }
  if (!/^[+0-9 ().-]{8,20}$/.test(champs.telephone))
    return { erreur: "Le numéro de téléphone n'a pas l'air valide.", champs }
  if (!/^\S+@\S+\.\S+$/.test(champs.email))
    return { erreur: "L'adresse e-mail n'a pas l'air valide.", champs }
  if (motDePasse.length < 8)
    return { erreur: "Le mot de passe doit contenir au moins 8 caractères.", champs }

  const intervenant = champs.role === "intervenant"
  const espace = trouverEspace(champs.espace)
  if (!espace) return { erreur: "Choisissez votre espace.", champs }
  if (intervenant) {
    if (!espace.types.some((t) => t.valeur === champs.type_intervenant))
      return { erreur: "Choisissez votre rôle dans cet espace.", champs }
  }

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
        ...(intervenant ? { type_intervenant: champs.type_intervenant } : {}),
      },
    },
  })

  if (error) return { erreur: traduireErreur(error), champs }

  // Si Supabase ne demande pas de confirmation par e-mail, on est déjà connecté.
  if (data.session) redirect("/accueil")

  // Supabase ne signale pas les e-mails déjà utilisés : il renvoie un compte sans identité.
  if (data.user && data.user.identities?.length === 0)
    return {
      erreur: "Un compte existe déjà avec cet e-mail. Essayez plutôt de vous connecter.",
      champs,
    }

  return {
    succes: `Presque fini ! Nous avons envoyé un e-mail à ${champs.email}. Cliquez sur le lien qu'il contient pour activer votre compte.`,
  }
}

export async function connexion(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const email = texte(formData, "email")
  const motDePasse = String(formData.get("mot_de_passe") ?? "")

  if (!email || !motDePasse)
    return { erreur: "Merci de remplir votre e-mail et votre mot de passe.", champs: { email } }

  const supabase = await createClient()
  // On repart de zéro : l'ancienne session est fermée avant la nouvelle connexion
  await supabase.auth.signOut()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  })

  if (error) return { erreur: traduireErreur(error), champs: { email } }

  redirect("/accueil")
}

export async function deconnexion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
