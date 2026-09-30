"use client"

import { useEffect, useState } from "react"

/** L'heure actuelle, remise à jour régulièrement (pour les comptes à rebours). */
export function useMaintenant(intervalle = 30000) {
  const [maintenant, setMaintenant] = useState(() => Date.now())
  useEffect(() => {
    const minuteur = setInterval(() => setMaintenant(Date.now()), intervalle)
    return () => clearInterval(minuteur)
  }, [intervalle])
  return maintenant
}
