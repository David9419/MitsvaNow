"use client"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

// Clé PUBLIQUE des notifications (la clé privée est rangée dans le coffre-fort Supabase).
const CLE_PUBLIQUE_VAPID =
  "BLHGXAklBtI5NX7F21dVv3v822mUpg5q5E7zooQU47jLSHbSIfWO6C_yH93tr2qytqE-6JPcyYqnTDN-ljDB_qU"

/**
 * Où en sont les notifications sur cet appareil :
 * - "chargement"      : on vérifie
 * - "ecran-accueil"   : iPhone/iPad, il faut d'abord ajouter le site à l'écran d'accueil
 * - "non-supporte"    : navigateur trop ancien
 * - "refuse"          : la personne a bloqué les notifications
 * - "inactif"         : pas encore activées
 * - "actif"           : tout est prêt
 */
export type EtatPush = "chargement" | "ecran-accueil" | "non-supporte" | "refuse" | "inactif" | "actif"

type Supabase = SupabaseClient<Database>

export function estAppareilApple() {
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
}

function estInstallee() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function pushPossible() {
  return "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined"
}

function cleEnOctets(base64: string) {
  const b64 = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  const brut = atob(b64)
  return Uint8Array.from(brut, (c) => c.charCodeAt(0))
}

async function enregistrer(supabase: Supabase, abonnement: PushSubscription) {
  const json = abonnement.toJSON()
  const { error } = await supabase.rpc("enregistrer_abonnement_push", {
    p_endpoint: abonnement.endpoint,
    p_p256dh: json.keys?.p256dh ?? "",
    p_auth: json.keys?.auth ?? "",
  })
  if (error) throw error
}

async function abonner() {
  const reg = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready
  return (
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: cleEnOctets(CLE_PUBLIQUE_VAPID),
    }))
  )
}

/** Regarde l'état actuel, et remet l'abonnement à jour s'il existe déjà. */
export async function verifierPush(supabase: Supabase): Promise<EtatPush> {
  if (!pushPossible()) return estAppareilApple() && !estInstallee() ? "ecran-accueil" : "non-supporte"
  if (Notification.permission === "denied") return "refuse"
  if (Notification.permission !== "granted") return "inactif"
  try {
    await enregistrer(supabase, await abonner())
    return "actif"
  } catch {
    return "inactif"
  }
}

/** Demande l'autorisation puis abonne cet appareil. À appeler après un clic. */
export async function activerPush(supabase: Supabase): Promise<EtatPush> {
  if (!pushPossible()) return estAppareilApple() && !estInstallee() ? "ecran-accueil" : "non-supporte"
  // Doit être le premier « await » après le clic (exigence de Safari)
  const permission = await Notification.requestPermission()
  if (permission === "denied") return "refuse"
  if (permission !== "granted") return "inactif"
  await enregistrer(supabase, await abonner())
  return "actif"
}

/** Envoie une notification de test à tous mes appareils (au bout de 5 s). */
export async function testerPush(supabase: Supabase) {
  const { data, error } = await supabase.functions.invoke<{ envoyes: number }>("notifier-demande", {
    body: { test: true },
  })
  if (error) throw error
  return data?.envoyes ?? 0
}
