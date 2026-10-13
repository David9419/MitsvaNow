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

// ---------- Application iPhone / Android (Capacitor) ----------
// Dans l'application, le site parle au téléphone par window.Capacitor
// (le module PushNotifications est installé dans le dossier application/).
type Ecouteur = { remove: () => Promise<void> }
type PermissionNatif = { receive: "prompt" | "prompt-with-rationale" | "granted" | "denied" }
export type ActionNotificationNatif = {
  actionId: string
  notification: { data?: { demande?: string; url?: string } }
}
type PushNatif = {
  checkPermissions(): Promise<PermissionNatif>
  requestPermissions(): Promise<PermissionNatif>
  register(): Promise<void>
  unregister(): Promise<void>
  createChannel(c: { id: string; name: string; importance: number; visibility?: number; vibration?: boolean }): Promise<void>
  addListener(e: "registration", f: (t: { value: string }) => void): Promise<Ecouteur>
  addListener(e: "registrationError", f: (err: { error: string }) => void): Promise<Ecouteur>
  addListener(e: "pushNotificationActionPerformed", f: (a: ActionNotificationNatif) => void): Promise<Ecouteur>
}
type CapacitorGlobal = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  Plugins?: { PushNotifications?: PushNatif }
}

/** Le module de notifications du téléphone, si on est dans l'application Android. */
export function pushNatif(): PushNatif | null {
  if (typeof window === "undefined") return null
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor
  if (!cap?.isNativePlatform?.()) return null
  // iPhone : sera branché avec le compte Apple (notifications Apple)
  if (cap.getPlatform?.() !== "android") return null
  return cap.Plugins?.PushNotifications ?? null
}

const CLE_JETON = "mn-jeton-natif"

/** Demande au téléphone son « adresse de notification » Firebase et l'enregistre. */
async function enregistrerNatif(supabase: Supabase, natif: PushNatif) {
  await natif.createChannel({ id: "demandes", name: "Mivtsa Now", importance: 5, visibility: 1, vibration: true })
  const jeton = await new Promise<string>((resolve, reject) => {
    const ecouteurs: Promise<Ecouteur>[] = []
    const fin = () => ecouteurs.forEach((e) => e.then((x) => x.remove()))
    const delai = setTimeout(() => {
      fin()
      reject(new Error("Firebase"))
    }, 20_000)
    ecouteurs.push(
      natif.addListener("registration", (t) => {
        clearTimeout(delai)
        fin()
        resolve(t.value)
      }),
      natif.addListener("registrationError", (e) => {
        clearTimeout(delai)
        fin()
        reject(new Error(e.error))
      })
    )
    natif.register().catch(reject)
  })
  const { error } = await supabase.rpc("enregistrer_appareil_natif", { p_jeton: jeton, p_plateforme: "android" })
  if (error) throw error
  try {
    localStorage.setItem(CLE_JETON, jeton)
  } catch {}
}

function pushPossible() {
  return "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined"
}

// Retient que la personne a coupé les notifications sur cet appareil
const CLE_COUPEES = "mn-notifications-coupees"
function coupees() {
  try {
    return localStorage.getItem(CLE_COUPEES) === "1"
  } catch {
    return false
  }
}
function retenirCoupees(v: boolean) {
  try {
    if (v) localStorage.setItem(CLE_COUPEES, "1")
    else localStorage.removeItem(CLE_COUPEES)
  } catch {}
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
  const natif = pushNatif()
  if (natif) {
    const { receive } = await natif.checkPermissions()
    if (receive === "denied") return "refuse"
    if (receive !== "granted" || coupees()) return "inactif"
    try {
      await enregistrerNatif(supabase, natif)
      return "actif"
    } catch {
      return "inactif"
    }
  }
  if (!pushPossible()) return estAppareilApple() && !estInstallee() ? "ecran-accueil" : "non-supporte"
  if (Notification.permission === "denied") return "refuse"
  if (Notification.permission !== "granted" || coupees()) return "inactif"
  try {
    await enregistrer(supabase, await abonner())
    return "actif"
  } catch {
    return "inactif"
  }
}

/** Demande l'autorisation puis abonne cet appareil. À appeler après un clic. */
export async function activerPush(supabase: Supabase): Promise<EtatPush> {
  const natif = pushNatif()
  if (natif) {
    const { receive } = await natif.requestPermissions()
    if (receive === "denied") return "refuse"
    if (receive !== "granted") return "inactif"
    await enregistrerNatif(supabase, natif)
    retenirCoupees(false)
    return "actif"
  }
  if (!pushPossible()) return estAppareilApple() && !estInstallee() ? "ecran-accueil" : "non-supporte"
  // Doit être le premier « await » après le clic (exigence de Safari)
  const permission = await Notification.requestPermission()
  if (permission === "denied") return "refuse"
  if (permission !== "granted") return "inactif"
  await enregistrer(supabase, await abonner())
  retenirCoupees(false)
  return "actif"
}

/** Désabonne cet appareil : plus aucune notification ici. */
export async function desactiverPush(supabase: Supabase) {
  retenirCoupees(true)
  const natif = pushNatif()
  if (natif) {
    let jeton: string | null = null
    try {
      jeton = localStorage.getItem(CLE_JETON)
    } catch {}
    if (jeton) await supabase.rpc("retirer_appareil_natif", { p_jeton: jeton })
    await natif.unregister()
    return
  }
  if (!pushPossible()) return
  const reg = await navigator.serviceWorker.getRegistration("/")
  const abonnement = await reg?.pushManager.getSubscription()
  if (!abonnement) return
  await supabase.rpc("supprimer_abonnement_push", { p_endpoint: abonnement.endpoint })
  await abonnement.unsubscribe()
}

/** Envoie une notification de test à tous mes appareils (au bout de 5 s). */
export async function testerPush(supabase: Supabase) {
  const { data, error } = await supabase.functions.invoke<{ envoyes: number }>("notifier-demande", {
    body: { test: true },
  })
  if (error) throw error
  return data?.envoyes ?? 0
}
