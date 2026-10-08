"use client"

import { useEffect, useRef } from "react"

import { createClient } from "@/lib/supabase/client"

/**
 * Écoute en direct les changements de la table « demandes » qui concernent
 * l'utilisateur (comme demandeur ou comme intervenant), et appelle
 * « rafraichir » à chaque changement. Vérifie aussi toutes les 30 s par sécurité.
 */
export function useTempsReel(
  colonne: "demandeur_id" | "intervenant_id",
  utilisateurId: string,
  rafraichir: () => void
) {
  const rappel = useRef(rafraichir)
  useEffect(() => {
    rappel.current = rafraichir
  }, [rafraichir])

  useEffect(() => {
    const supabase = createClient()
    let canal = supabase
      .channel(`demandes-${colonne}-${utilisateurId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "demandes",
          filter: `${colonne}=eq.${utilisateurId}`,
        },
        () => rappel.current()
      )
    // Intervenant : on écoute aussi les demandes qui lui sont proposées (ou retirées)
    if (colonne === "intervenant_id")
      canal = canal.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "demande_propositions",
          filter: `intervenant_id=eq.${utilisateurId}`,
        },
        () => rappel.current()
      )
    canal.subscribe()

    const minuteur = setInterval(() => rappel.current(), 30000)
    const auRetour = () => {
      if (document.visibilityState === "visible") rappel.current()
    }
    document.addEventListener("visibilitychange", auRetour)

    return () => {
      clearInterval(minuteur)
      document.removeEventListener("visibilitychange", auRetour)
      supabase.removeChannel(canal)
    }
  }, [colonne, utilisateurId])
}
