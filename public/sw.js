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
    tag: m.demande || "mivtsa-now",
    data: { demande: m.demande || null },
    requireInteraction: Boolean(m.demande),
  }
  // Les boutons s'affichent sur Chrome, Edge et Android
  if (m.actions)
    options.actions = [
      { action: "accepter", title: "✅ Accepter" },
      { action: "refuser", title: "Pas disponible" },
    ]
  event.waitUntil(self.registration.showNotification(m.titre || "Mivtsa Now", options))
})

self.addEventListener("notificationclick", (event) => {
  const demande = event.notification.data && event.notification.data.demande
  const reponse = event.action // "accepter", "refuser" ou "" (clic sur la notification)
  event.notification.close()

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
