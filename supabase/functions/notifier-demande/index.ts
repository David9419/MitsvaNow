// Fonction Supabase « notifier-demande » : envoie les notifications sur le
// téléphone, même quand le site est fermé :
//   - à l'intervenant : « Nouvelle demande »
//   - au demandeur : demande acceptée, intervenant en route, mitsva accomplie
//
// Deux façons de l'appeler :
//   - par la base de données (déclencheur), avec l'en-tête x-secret :
//       { "demande": "<id>", "pour": "intervenant" | "demandeur" }
//   - par une personne connectée, pour tester ses notifications :
//       { "test": true }  (envoyée tout de suite)
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
        console.log("Envoyée", new URL(a.endpoint).host)
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await admin.from("abonnements_push").delete().eq("endpoint", a.endpoint)
        } else {
          console.error("Envoi raté", new URL(a.endpoint).host, code, (e as Error).message)
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
      const pourDemandeur = corps.pour === "demandeur"
      const { data } = await admin.rpc(
        pourDemandeur ? "preparer_notification_demandeur" : "preparer_notification_push",
        { p_demande: corps.demande }
      )
      const n = data as { demande: string; titre: string; corps: string; abonnements: Abonnement[] } | null
      if (!n || !n.abonnements.length) return reponse({ envoyes: 0 })
      const envoyes = await envoyer(n.abonnements, {
        titre: n.titre,
        corps: n.corps,
        demande: n.demande,
        // Boutons Accepter / Pas disponible seulement pour l'intervenant
        actions: !pourDemandeur,
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
    const envoyes = await envoyer(liste, {
      titre: "Mivtsa Now 🔔",
      corps: "Ça marche ! Les notifications sont bien activées sur cet appareil.",
    })
    return reponse({ envoyes })
  } catch (e) {
    console.error(e)
    return reponse({ erreur: (e as Error).message }, 500)
  }
})
