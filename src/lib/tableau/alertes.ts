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

export async function demanderPermissionNotifications() {
  if (typeof Notification === "undefined") return "denied"
  if (Notification.permission !== "default") return Notification.permission
  return Notification.requestPermission()
}
