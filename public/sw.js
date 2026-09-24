// Service worker de Mivtsa Now : affiche les notifications de nouvelles
// demandes (avec les boutons Accepter / Pas disponible) et transmet la
// réponse à la page du tableau de bord.

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

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
        await self.clients.openWindow(`/accueil?${params.toString()}`)
      }
    })()
  )
})
