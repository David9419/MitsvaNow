// Fonction Supabase « notifier-demande » : envoie la notification « Nouvelle
// demande » sur le téléphone de l'intervenant, même quand le site est fermé.
//
// Deux façons de l'appeler :
//   - par la base de données (déclencheur), avec l'en-tête x-secret :
//       { "demande": "<id>" }
//   - par une personne connectée, pour tester ses notifications :
//       { "test": true }  (envoyée au bout de 5 secondes)
import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

type Abonnement = { endpoint: string; p256dh: string; auth: string }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reponse = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  })

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
)

let secrets: Record<string, string> | null = null
async function lireSecrets() {
  if (!secrets) {
    const { data, error } = await admin.rpc("secrets_push")
    if (error || !data) throw new Error("Clés de notification introuvables")
    secrets = data as Record<string, string>
    webpush.setVapidDetails(
      "https://mitsva-now.vercel.app",
      secrets.push_vapid_public,
      secrets.push_vapid_prive
    )
  }
  return secrets
}

/** Envoie le message à chaque appareil ; oublie ceux qui n'existent plus. */
async function envoyer(abonnements: Abonnement[], message: Record<string, unknown>) {
  let envoyes = 0
  await Promise.all(
    abonnements.map(async (a) => {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          JSON.stringify(message),
          { TTL: 60 * 60, urgency: "high" }
        )
        envoyes++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await admin.from("abonnements_push").delete().eq("endpoint", a.endpoint)
        } else {
          console.error("Envoi raté", code, (e as Error).message)
        }
      }
    })
  )
  return envoyes
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return reponse({ erreur: "Méthode non autorisée" }, 405)

  try {
    const s = await lireSecrets()
    const corps = await req.json().catch(() => ({}))

    // 1. Appel de la base de données : une demande vient d'être attribuée
    if (req.headers.get("x-secret")) {
      if (req.headers.get("x-secret") !== s.push_secret_declencheur)
        return reponse({ erreur: "Non autorisé" }, 401)
      const { data } = await admin.rpc("preparer_notification_push", { p_demande: corps.demande })
      const n = data as { demande: string; titre: string; corps: string; abonnements: Abonnement[] } | null
      if (!n || !n.abonnements.length) return reponse({ envoyes: 0 })
      const envoyes = await envoyer(n.abonnements, {
        titre: n.titre,
        corps: n.corps,
        demande: n.demande,
        actions: true,
      })
      return reponse({ envoyes })
    }

    // 2. Notification de test demandée par la personne connectée
    const jeton = (req.headers.get("authorization") ?? "").replace(/^Bearer /i, "")
    const { data: u } = await admin.auth.getUser(jeton)
    if (!u?.user) return reponse({ erreur: "Connexion requise" }, 401)
    if (!corps.test) return reponse({ erreur: "Requête inconnue" }, 400)

    const { data: abonnements } = await admin.rpc("abonnements_de", { p_utilisateur: u.user.id })
    const liste = (abonnements ?? []) as Abonnement[]
    if (!liste.length) return reponse({ envoyes: 0 })
    // Envoi en arrière-plan après une petite attente : le temps de fermer
    // le site ou de verrouiller le téléphone (on répond tout de suite).
    const envoi = new Promise((r) => setTimeout(r, 5000)).then(() =>
      envoyer(liste, {
        titre: "Mivtsa Now 🔔",
        corps: "Ça marche ! Vous recevrez ici les nouvelles demandes, même site fermé.",
      })
    )
    // @ts-ignore EdgeRuntime existe sur Supabase
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(envoi)
    else await envoi
    return reponse({ envoyes: liste.length })
  } catch (e) {
    console.error(e)
    return reponse({ erreur: (e as Error).message }, 500)
  }
})
