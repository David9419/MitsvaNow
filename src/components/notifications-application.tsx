"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { pushNatif } from "@/lib/tableau/push"

/**
 * Dans l'application Android : quand on touche une notification,
 * on ouvre la bonne page (la demande, ou l'Administration pour un signalement).
 * Sur le site (navigateur), ce composant ne fait rien : c'est sw.js qui s'en charge.
 */
export function NotificationsApplication() {
  const router = useRouter()

  useEffect(() => {
    const natif = pushNatif()
    if (!natif) return
    const ecouteur = natif.addListener("pushNotificationActionPerformed", (action) => {
      const url = action.notification.data?.url
      // Seulement des adresses du site (jamais une adresse extérieure)
      const cible = url && url.startsWith("/") && !url.startsWith("//") ? url : "/accueil"
      router.push(cible)
      router.refresh()
    })
    return () => {
      ecouteur.then((e) => e.remove())
    }
  }, [router])

  return null
}
