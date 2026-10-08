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
import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

type Abonnement = { endpoint: string; p256dh: string; auth: string }
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
        const envoyes = await envoyer((abos ?? []) as Abonnement[], TEST[await langueDe(corps.verifier)])
        return reponse({ envoyes })
      }
      if (!corps.demande || !corps.evenement || !corps.destinataire) return reponse({ erreur: "Requête incomplète" }, 400)
      const { data } = await admin.rpc("infos_notification", {
        p_demande: corps.demande,
        p_destinataire: corps.destinataire,
      })
      const infos = data as Infos | null
      if (!infos || !infos.abonnements.length) return reponse({ envoyes: 0 })
      const t = texte(corps.evenement, infos)
      if (!t) return reponse({ envoyes: 0 })
      const nouvelle = corps.evenement === "nouvelle"
      const envoyes = await envoyer(infos.abonnements, {
        ...t,
        demande: infos.demande,
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
    if (!liste.length) return reponse({ envoyes: 0 })
    const envoyes = await envoyer(liste, TEST[await langueDe(u.user.id)])
    return reponse({ envoyes })
  } catch (e) {
    console.error(e)
    return reponse({ erreur: (e as Error).message }, 500)
  }
})
