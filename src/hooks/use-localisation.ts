"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type Position = { lat: number; lng: number; precision: number }
export type EtatLocalisation = "inconnu" | "demande" | "active" | "refusee" | "indisponible"

/**
 * Localisation du navigateur.
 * - active() : demande l'autorisation puis récupère la position
 * - suivre : si vrai, suit la position tant que la page est ouverte
 */
export function useLocalisation({ suivre = false }: { suivre?: boolean } = {}) {
  const [etat, setEtat] = useState<EtatLocalisation>("inconnu")
  const [position, setPosition] = useState<Position | null>(null)
  const surveillance = useRef<number | null>(null)

  const recevoir = useCallback((p: GeolocationPosition) => {
    setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, precision: p.coords.accuracy })
    setEtat("active")
  }, [])

  const erreur = useCallback((e: GeolocationPositionError) => {
    setEtat(e.code === e.PERMISSION_DENIED ? "refusee" : "indisponible")
  }, [])

  const activer = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setEtat("indisponible")
      return Promise.resolve<Position | null>(null)
    }
    setEtat("demande")
    return new Promise<Position | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          recevoir(p)
          resolve({ lat: p.coords.latitude, lng: p.coords.longitude, precision: p.coords.accuracy })
        },
        (e) => {
          erreur(e)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      )
    })
  }, [recevoir, erreur])

  // Si l'autorisation a déjà été donnée, on active sans rien demander
  useEffect(() => {
    let annule = false
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((p) => {
        if (annule) return
        if (p.state === "granted") activer()
        else if (p.state === "denied") setEtat("refusee")
      })
      .catch(() => {})
    return () => {
      annule = true
    }
  }, [activer])

  // Suivi continu de la position
  useEffect(() => {
    if (!suivre || etat !== "active" || !navigator.geolocation) return
    surveillance.current = navigator.geolocation.watchPosition(recevoir, erreur, {
      enableHighAccuracy: true,
      maximumAge: 60000,
    })
    return () => {
      if (surveillance.current != null) navigator.geolocation.clearWatch(surveillance.current)
    }
  }, [suivre, etat, recevoir, erreur])

  return { etat, position, activer }
}

/** Distance à vol d'oiseau entre deux points (en mètres). */
export function distanceMetres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
