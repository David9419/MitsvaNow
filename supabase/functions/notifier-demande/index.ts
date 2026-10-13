// Fonction Supabase « notifier-demande » : envoie les notifications sur le
// téléphone, même quand le site est fermé, dans la langue de chaque personne
// (français, hébreu ou anglais).
//
// Deux façons de l'appeler :
//   - par la base de données (déclencheur), avec l'en-tête x-secret :
//       { "demande": "<id>", "evenement": "<événement>", "destinataire": "<id de la personne>" }
//       ou { "verifier": "<id de la personne>" } (notification de test)
//   - par une personne connectée, pour tester ses notifications :
//       { "test": true }  (envoyée tout de suite)
//
// Événements :
//   pour l'intervenant : nouvelle, confirmee, refusee, annulee, avis
//   pour le demandeur  : acceptee, en_cours, terminee, annulee, expiree, relance
//   pour les administrateurs : signalement (ouvre la page Administration)
//
// Chaque notification part à la fois :
//   - aux navigateurs (web push, table abonnements_push) ;
//   - aux téléphones qui ont l'application Android (Firebase, table appareils_natifs),
//     si le secret FIREBASE_SERVICE_ACCOUNT est réglé dans Supabase.
import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"
import { importPKCS8, SignJWT } from "npm:jose@5.9.6"

type Abonnement = { endpoint: string; p256dh: string; auth: string }
type Jeton = { jeton: string; plateforme: "android" | "ios" }
type Langue = "fr" | "he" | "en"
type Infos = {
  demande: string
  statut: string
  service: Record<Langue, string>
  demandeur: string
  intervenant: string | null
  adresse: string | null
  distance_m: number | null
  programmee_pour: string | null
  transport: string | null
  eta_minutes: number | null
  motif: string | null
  note: number | null
  langue: Langue
  abonnements: Abonnement[]
  jetons?: Jeton[]
}

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

// ---------- Textes dans les 3 langues ----------
const LOCALES: Record<Langue, string> = { fr: "fr-FR", he: "he-IL", en: "en-GB" }
const FUSEAUX: Record<Langue, string> = { fr: "Europe/Paris", he: "Asia/Jerusalem", en: "Europe/Paris" }

const TRANSPORTS: Record<Langue, Record<string, string>> = {
  fr: { a_pied: "à pied", trottinette: "en trottinette", velo: "à vélo", voiture: "en voiture", transports: "en transports" },
  he: { a_pied: "ברגל", trottinette: "בקורקינט", velo: "באופניים", voiture: "ברכב", transports: "בתחבורה ציבורית" },
  en: { a_pied: "on foot", trottinette: "by scooter", velo: "by bike", voiture: "by car", transports: "by public transport" },
}

function distance(m: number | null, l: Langue) {
  if (m == null) return ""
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} ${l === "he" ? "מ׳" : "m"}`
  return `${(m / 1000).toLocaleString(LOCALES[l], { maximumFractionDigits: 1 })} ${l === "he" ? "ק״מ" : "km"}`
}

function quand(date: string | null, l: Langue) {
  if (!date) return ""
  return new Date(date).toLocaleString(LOCALES[l], {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSEAUX[l],
  })
}

function texte(evenement: string, i: Infos): { titre: string; corps: string } | null {
  const l = i.langue
  const service = i.service[l] ?? i.service.fr
  const qui = i.intervenant ?? { fr: "L'intervenant", he: "המתנדב", en: "The volunteer" }[l]
  const loin = distance(i.distance_m, l)
  const prevue = i.programmee_pour ? quand(i.programmee_pour, l) : ""
  const moyen = i.transport ? TRANSPORTS[l][i.transport] ?? "" : ""
  const motif = i.motif ?? ""
  // « 🛵 en trottinette · arrivée dans ~10 min »
  const arrivee = (avant: string, apres: string) => {
    const parties = [moyen && `🛵 ${moyen}`, i.eta_minutes && `${avant}${i.eta_minutes}${apres}`].filter(Boolean)
    return parties.length ? `\n${parties.join(" · ")}.` : ""
  }

  const T: Record<Langue, Record<string, () => { titre: string; corps: string }>> = {
    fr: {
      nouvelle: () => ({
        titre: `${prevue ? "Demande programmée" : "Nouvelle demande"} : ${service}`,
        corps: `${i.demandeur}\n📍 ${i.adresse ?? "Adresse non précisée"}${loin ? ` (à ${loin})` : ""}${prevue ? `\n🗓️ ${prevue}` : ""}`,
      }),
      acceptee: () => ({
        titre: "Demande acceptée ✅",
        corps: `${qui} a accepté : ${service}.${arrivee("arrivée dans ~", " min")} Ouvrez l'application pour confirmer.`,
      }),
      en_cours: () => ({ titre: "Intervenant en route 🚗", corps: `${qui} est en route vers vous (${service}).` }),
      terminee: () => ({ titre: "Mitsva accomplie 🎉", corps: "Merci d'avoir fait appel à Mivtsa Now ! Donnez votre avis dans l'application." }),
      expiree: () => ({
        titre: "Demande expirée ⏳",
        corps: `Personne n'a pu répondre à votre demande (${service}) à temps. Vous pouvez la refaire quand vous voulez.`,
      }),
      annulee: () => ({ titre: "Demande annulée ❌", corps: `${service}${motif ? `\nMotif : ${motif}` : ""}` }),
      relance: () => ({
        titre: "L'intervenant a annulé sa venue 🔄",
        corps: `${service}${motif ? `\nMotif : ${motif}` : ""}\nNous renvoyons votre demande à tous les intervenants proches.`,
      }),
      refusee: () => ({
        titre: "Demande annulée ❌",
        corps: `${i.demandeur} a préféré un autre intervenant pour : ${service}.`,
      }),
      confirmee: () => ({
        titre: "C'est confirmé, vous pouvez y aller ✅",
        corps: `${i.demandeur} vous attend : ${service}${prevue ? ` (${prevue})` : ""}.`,
      }),
      avis: () => ({
        titre: `Nouvel avis ${"★".repeat(i.note ?? 0)}`,
        corps: `${i.demandeur} vous a laissé un avis (${service}).`,
      }),
      signalement: () => ({
        titre: "Nouveau signalement 🚩",
        corps: `Demande : ${service}. Ouvrez l'Administration pour voir le détail.`,
      }),
    },
    he: {
      nouvelle: () => ({
        titre: `${prevue ? "בקשה מתוזמנת" : "בקשה חדשה"}: ${service}`,
        corps: `${i.demandeur}\n📍 ${i.adresse ?? "כתובת לא צוינה"}${loin ? ` (${loin})` : ""}${prevue ? `\n🗓️ ${prevue}` : ""}`,
      }),
      acceptee: () => ({
        titre: "הבקשה התקבלה ✅",
        corps: `${qui} קיבל/ה: ${service}.${arrivee("הגעה בעוד כ־", " דק׳")} פתחו את האפליקציה כדי לאשר.`,
      }),
      en_cours: () => ({ titre: "בדרך אליך 🚗", corps: `${qui} בדרך אליך (${service}).` }),
      terminee: () => ({ titre: "המצווה בוצעה 🎉", corps: "תודה שפנית ל־Mivtsa Now! אפשר לדרג באפליקציה." }),
      expiree: () => ({
        titre: "הבקשה פגה ⏳",
        corps: `אף אחד לא הספיק לענות לבקשה שלך (${service}). אפשר לשלוח אותה שוב מתי שתרצה.`,
      }),
      annulee: () => ({ titre: "הבקשה בוטלה ❌", corps: `${service}${motif ? `\nסיבה: ${motif}` : ""}` }),
      relance: () => ({
        titre: "המתנדב ביטל את ההגעה 🔄",
        corps: `${service}${motif ? `\nסיבה: ${motif}` : ""}\nאנחנו שולחים את הבקשה שוב לכל המתנדבים הקרובים.`,
      }),
      refusee: () => ({ titre: "הבקשה בוטלה ❌", corps: `${i.demandeur} בחר/ה מתנדב אחר עבור: ${service}.` }),
      confirmee: () => ({
        titre: "אושר, אפשר לצאת לדרך ✅",
        corps: `${i.demandeur} מחכה לך: ${service}${prevue ? ` (${prevue})` : ""}.`,
      }),
      avis: () => ({ titre: `חוות דעת חדשה ${"★".repeat(i.note ?? 0)}`, corps: `${i.demandeur} השאיר/ה לך חוות דעת (${service}).` }),
      signalement: () => ({ titre: "דיווח חדש 🚩", corps: `בקשה: ${service}. פתחו את דף הניהול כדי לראות את הפרטים.` }),
    },
    en: {
      nouvelle: () => ({
        titre: `${prevue ? "Scheduled request" : "New request"}: ${service}`,
        corps: `${i.demandeur}\n📍 ${i.adresse ?? "Address not given"}${loin ? ` (${loin} away)` : ""}${prevue ? `\n🗓️ ${prevue}` : ""}`,
      }),
      acceptee: () => ({
        titre: "Request accepted ✅",
        corps: `${qui} accepted: ${service}.${arrivee("arriving in ~", " min")} Open the app to confirm.`,
      }),
      en_cours: () => ({ titre: "On the way 🚗", corps: `${qui} is on the way to you (${service}).` }),
      terminee: () => ({ titre: "Mitzvah done 🎉", corps: "Thank you for using Mivtsa Now! Leave a review in the app." }),
      expiree: () => ({
        titre: "Request expired ⏳",
        corps: `Nobody could answer your request (${service}) in time. You can send it again whenever you like.`,
      }),
      annulee: () => ({ titre: "Request cancelled ❌", corps: `${service}${motif ? `\nReason: ${motif}` : ""}` }),
      relance: () => ({
        titre: "The volunteer cancelled 🔄",
        corps: `${service}${motif ? `\nReason: ${motif}` : ""}\nWe're sending your request again to all nearby volunteers.`,
      }),
      refusee: () => ({ titre: "Request cancelled ❌", corps: `${i.demandeur} chose another volunteer for: ${service}.` }),
      confirmee: () => ({
        titre: "Confirmed, you can go ✅",
        corps: `${i.demandeur} is expecting you: ${service}${prevue ? ` (${prevue})` : ""}.`,
      }),
      avis: () => ({ titre: `New review ${"★".repeat(i.note ?? 0)}`, corps: `${i.demandeur} left you a review (${service}).` }),
      signalement: () => ({ titre: "New report 🚩", corps: `Request: ${service}. Open the Administration page to see the details.` }),
    },
  }
  const f = (T[l] ?? T.fr)[evenement]
  return f ? f() : null
}

const TEST: Record<Langue, { titre: string; corps: string }> = {
  fr: { titre: "Mivtsa Now 🔔", corps: "Ça marche ! Les notifications sont bien activées sur cet appareil." },
  he: { titre: "Mivtsa Now 🔔", corps: "זה עובד! ההתראות פעילות במכשיר הזה." },
  en: { titre: "Mivtsa Now 🔔", corps: "It works! Notifications are turned on for this device." },
}

const BOUTONS: Record<Langue, { accepter: string; refuser: string }> = {
  fr: { accepter: "✅ Accepter", refuser: "Pas disponible" },
  he: { accepter: "✅ לקבל", refuser: "לא זמין" },
  en: { accepter: "✅ Accept", refuser: "Not available" },
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

// ---------- Application Android : Firebase Cloud Messaging ----------
type CompteFirebase = { project_id: string; client_email: string; private_key: string }
let compteFirebase: CompteFirebase | null | undefined
let acces: { jeton: string; expire: number } | null = null

function lireCompteFirebase() {
  if (compteFirebase === undefined) {
    try {
      const brut = Deno.env.get("FIREBASE_SERVICE_ACCOUNT")
      compteFirebase = brut ? (JSON.parse(brut) as CompteFirebase) : null
    } catch {
      console.error("FIREBASE_SERVICE_ACCOUNT illisible")
      compteFirebase = null
    }
  }
  return compteFirebase
}

/** Jeton d'accès Google (valable 1 h), obtenu avec la clé du compte de service. */
async function accesFirebase(c: CompteFirebase) {
  if (acces && acces.expire > Date.now() + 60_000) return acces.jeton
  const cle = await importPKCS8(c.private_key, "RS256")
  const maintenant = Math.floor(Date.now() / 1000)
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(c.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(maintenant)
    .setExpirationTime(maintenant + 3600)
    .sign(cle)
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  })
  const d = await r.json()
  if (!r.ok || !d.access_token) throw new Error(`Accès Firebase refusé : ${JSON.stringify(d)}`)
  acces = { jeton: d.access_token, expire: Date.now() + (d.expires_in ?? 3600) * 1000 }
  return acces.jeton
}

/** Envoie le message aux téléphones Android ; met de côté les jetons qui n'existent plus. */
async function envoyerNatif(jetons: Jeton[], message: Record<string, unknown>) {
  // iPhone : branché plus tard (Apple Push Notification service), une fois le compte Apple prêt
  const android = jetons.filter((j) => j.plateforme === "android")
  const c = lireCompteFirebase()
  if (!android.length || !c) return 0
  let envoyes = 0
  try {
    const jetonAcces = await accesFirebase(c)
    const donnees: Record<string, string> = {}
    if (message.demande) donnees.demande = String(message.demande)
    if (message.url) donnees.url = String(message.url)
    await Promise.all(
      android.map(async (j) => {
        const r = await fetch(`https://fcm.googleapis.com/v1/projects/${c.project_id}/messages:send`, {
          method: "POST",
          headers: { Authorization: `Bearer ${jetonAcces}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: {
              token: j.jeton,
              notification: { title: String(message.titre ?? "Mivtsa Now"), body: String(message.corps ?? "") },
              data: donnees,
              android: {
                priority: "high",
                ttl: "3600s",
                notification: {
                  channel_id: "demandes",
                  sound: "default",
                  tag: String(message.demande ?? message.url ?? "mivtsa-now"),
                },
              },
            },
          }),
        })
        if (r.ok) {
          envoyes++
          console.log("Envoyée", "android")
          return
        }
        const erreur = await r.text()
        if (r.status === 404 || erreur.includes("UNREGISTERED") || erreur.includes("registration token is not a valid")) {
          await admin.from("appareils_natifs").update({ actif: false, maj_le: new Date().toISOString() }).eq("jeton", j.jeton)
        } else {
          console.error("Envoi Android raté", r.status, erreur)
        }
      })
    )
  } catch (e) {
    console.error("Firebase", (e as Error).message)
  }
  return envoyes
}

/** Envoie partout : navigateurs + téléphones avec l'application. */
async function envoyerPartout(abonnements: Abonnement[], jetons: Jeton[], message: Record<string, unknown>) {
  const [web, natif] = await Promise.all([envoyer(abonnements, message), envoyerNatif(jetons, message)])
  return web + natif
}

async function jetonsDe(id: string) {
  const { data } = await admin.rpc("jetons_de", { p_utilisateur: id })
  return (data ?? []) as Jeton[]
}

async function langueDe(id: string): Promise<Langue> {
  const { data } = await admin.rpc("langue_de", { p_utilisateur: id })
  return (["fr", "he", "en"].includes(data as string) ? data : "fr") as Langue
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return reponse({ erreur: "Méthode non autorisée" }, 405)

  try {
    const s = await lireSecrets()
    const corps = await req.json().catch(() => ({}))

    // 1. Appel de la base de données
    if (req.headers.get("x-secret")) {
      if (req.headers.get("x-secret") !== s.push_secret_declencheur)
        return reponse({ erreur: "Non autorisé" }, 401)
      // Vérification technique : notification de test pour une personne précise
      if (corps.verifier) {
        const { data: abos } = await admin.rpc("abonnements_de", { p_utilisateur: corps.verifier })
        const envoyes = await envoyerPartout(
          (abos ?? []) as Abonnement[],
          await jetonsDe(corps.verifier),
          TEST[await langueDe(corps.verifier)]
        )
        return reponse({ envoyes })
      }
      if (!corps.demande || !corps.evenement || !corps.destinataire) return reponse({ erreur: "Requête incomplète" }, 400)
      const { data } = await admin.rpc("infos_notification", {
        p_demande: corps.demande,
        p_destinataire: corps.destinataire,
      })
      const infos = data as Infos | null
      const jetons = infos?.jetons ?? []
      if (!infos || (!infos.abonnements.length && !jetons.length)) return reponse({ envoyes: 0 })
      const t = texte(corps.evenement, infos)
      if (!t) return reponse({ envoyes: 0 })
      const nouvelle = corps.evenement === "nouvelle"
      const signalement = corps.evenement === "signalement"
      const envoyes = await envoyerPartout(infos.abonnements, jetons, {
        ...t,
        // Un signalement ouvre la page Administration (pas la demande)
        demande: signalement ? undefined : infos.demande,
        url: signalement ? "/accueil/admin" : undefined,
        // Boutons Accepter / Pas disponible seulement pour une nouvelle demande
        actions: nouvelle,
        boutons: nouvelle ? BOUTONS[infos.langue] ?? BOUTONS.fr : undefined,
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
    const jetons = await jetonsDe(u.user.id)
    if (!liste.length && !jetons.length) return reponse({ envoyes: 0 })
    const envoyes = await envoyerPartout(liste, jetons, TEST[await langueDe(u.user.id)])
    return reponse({ envoyes })
  } catch (e) {
    console.error(e)
    return reponse({ erreur: (e as Error).message }, 500)
  }
})
