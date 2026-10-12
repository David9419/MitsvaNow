"use client"

import { useEffect } from "react"

import { createClient } from "@/lib/supabase/client"

/**
 * Prévient la base que la personne est sur le site (toutes les minutes, et
 * quand elle revient sur l'onglet). Sert à l'administrateur pour voir qui est en ligne.
 */
export function SignalPresence() {
  useEffect(() => {
    const supabase = createClient()
    const signaler = () => {
      if (document.visibilityState === "visible") supabase.rpc("signaler_presence").then(() => {})
    }
    signaler()
    const minuteur = setInterval(signaler, 60000)
    document.addEventListener("visibilitychange", signaler)
    return () => {
      clearInterval(minuteur)
      document.removeEventListener("visibilitychange", signaler)
    }
  }, [])
  return null
}
