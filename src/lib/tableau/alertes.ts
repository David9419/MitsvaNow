"use client"

/** Petit « ding » (deux notes) joué quand une nouvelle demande arrive. */
export function jouerSon() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.4)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch {
    // pas de son possible : tant pis
  }
}

/** Notification du navigateur (même si l'onglet est en arrière-plan). */
export function notifierNavigateur(titre: string, corps: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  try {
    new Notification(titre, { body: corps, icon: "/icon.png" })
  } catch {
    // certains navigateurs refusent hors service worker
  }
}

/** Installe le service worker qui gère les notifications avec boutons. */
export async function installerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null
  try {
    return await navigator.serviceWorker.register("/sw.js")
  } catch {
    return null
  }
}

/**
 * Notification « Nouvelle demande » avec le logo et les boutons
 * Accepter / Pas disponible (quand le navigateur le permet).
 */
export async function notifierNouvelleDemande(d: {
  id: string
  service: string
  nom: string
  adresse: string | null
  distance: string
}) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  const titre = `Nouvelle demande : ${d.service}`
  const corps = `${d.nom}\n📍 ${d.adresse ?? "Adresse non précisée"} (à ${d.distance})`
  try {
    const reg = await navigator.serviceWorker?.getRegistration("/")
    if (reg) {
      await reg.showNotification(titre, {
        body: corps,
        icon: "/icon.png",
        badge: "/icon.png",
        tag: d.id,
        requireInteraction: true,
        data: { demande: d.id },
        // Les boutons s'affichent sur Chrome, Edge et Android
        actions: [
          { action: "accepter", title: "✅ Accepter" },
          { action: "refuser", title: "Pas disponible" },
        ],
      } as NotificationOptions)
      return
    }
  } catch {
    // on se rabat sur une notification simple
  }
  notifierNavigateur(titre, corps)
}

export async function demanderPermissionNotifications() {
  if (typeof Notification === "undefined") return "denied"
  if (Notification.permission !== "default") return Notification.permission
  return Notification.requestPermission()
}
