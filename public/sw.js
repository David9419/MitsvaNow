// Service worker de Mivtsa Now : affiche les notifications de nouvelles
// demandes (avec les boutons Accepter / Pas disponible), y compris celles
// envoyées par le serveur quand le site est fermé, et transmet la réponse
// à la page du tableau de bord.

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

// Notification envoyée par le serveur (même quand le site est fermé)
self.addEventListener("push", (event) => {
  let m = {}
  try {
    m = event.data ? event.data.json() : {}
  } catch {
    m = { corps: event.data ? event.data.text() : "" }
  }
  const options = {
    body: m.corps || "",
    icon: "/icones/icone-192.png",
    badge: "/icones/icone-192.png",
    tag: m.demande || m.url || "mivtsa-now",
    data: { demande: m.demande || null, url: m.url || null },
    requireInteraction: Boolean(m.demande),
  }
  // Les boutons s'affichent sur Chrome, Edge et Android
  // (textes dans la langue de la personne, envoyés avec la notification)
  if (m.actions)
    options.actions = [
      { action: "accepter", title: (m.boutons && m.boutons.accepter) || "✅ Accepter" },
      { action: "refuser", title: (m.boutons && m.boutons.refuser) || "Pas disponible" },
    ]
  event.waitUntil(self.registration.showNotification(m.titre || "Mivtsa Now", options))
})

self.addEventListener("notificationclick", (event) => {
  const demande = event.notification.data && event.notification.data.demande
  const url = event.notification.data && event.notification.data.url
  const reponse = event.action // "accepter", "refuser" ou "" (clic sur la notification)
  event.notification.close()

  // Notification avec une adresse précise (ex. un signalement → page Administration)
  if (url) {
    event.waitUntil(
      (async () => {
        const fenetres = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
        const ouverte = fenetres.find((f) => new URL(f.url).pathname.startsWith("/accueil"))
        if (ouverte) {
          await ouverte.focus()
          await ouverte.navigate(url)
        } else {
          await self.clients.openWindow(url)
        }
      })()
    )
    return
  }

  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      const tableau = fenetres.find((f) => new URL(f.url).pathname.startsWith("/accueil"))
      if (tableau) {
        await tableau.focus()
        tableau.postMessage({ type: "reponse-demande", demande, reponse })
      } else {
        const params = new URLSearchParams()
        if (demande) params.set("demande", demande)
        if (reponse) params.set("reponse", reponse)
        const q = params.toString()
        await self.clients.openWindow(q ? `/accueil?${q}` : "/accueil")
      }
    })()
  )
})
