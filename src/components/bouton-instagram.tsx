"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type PointerEvent } from "react"

import { useT } from "@/components/i18n/langue-provider"
import { cn } from "@/lib/utils"

const LIEN = "https://www.instagram.com/mivtsanow?stkn=MXA4cXNzcmMzMDNuOQ%3D%3D&utm_source=qr"
const CLE = "mn-instagram-coin"

type Coin = "haut-gauche" | "haut-droite" | "bas-gauche" | "bas-droite"
const COINS: Coin[] = ["haut-gauche", "haut-droite", "bas-gauche", "bas-droite"]

// Marge avec le bord de l'écran ; en haut, on passe sous la barre du site (64 px)
const PLACE: Record<Coin, string> = {
  "haut-gauche": "left-4 top-20",
  "haut-droite": "right-4 top-20",
  "bas-gauche": "left-4 bottom-[max(1rem,env(safe-area-inset-bottom))]",
  "bas-droite": "right-4 bottom-[max(1rem,env(safe-area-inset-bottom))]",
}

/**
 * Bouton Instagram flottant : un appui ouvre notre compte Instagram,
 * un glisser (souris ou doigt) le déplace dans l'un des 4 coins de l'écran.
 * Le coin choisi est retenu sur cet appareil.
 */
export function BoutonInstagram() {
  const t = useT()
  const [coin, setCoin] = useState<Coin>("bas-droite")
  const [glisse, setGlisse] = useState<{ x: number; y: number } | null>(null)
  const depart = useRef<{ x: number; y: number; bouge: boolean } | null>(null)
  const aGlisse = useRef(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem(CLE) as Coin | null
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local
      if (v && COINS.includes(v)) setCoin(v)
    } catch {}
  }, [])

  const appui = (e: PointerEvent<HTMLAnchorElement>) => {
    depart.current = { x: e.clientX, y: e.clientY, bouge: false }
    aGlisse.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const deplacement = (e: PointerEvent<HTMLAnchorElement>) => {
    const d = depart.current
    if (!d) return
    if (!d.bouge && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return
    d.bouge = true
    setGlisse({ x: e.clientX, y: e.clientY })
  }

  const relache = (e: PointerEvent<HTMLAnchorElement>) => {
    const d = depart.current
    depart.current = null
    if (!d?.bouge) return
    // On pose le bouton dans le coin le plus proche du doigt
    aGlisse.current = true
    const haut = e.clientY < window.innerHeight / 2
    const gauche = e.clientX < window.innerWidth / 2
    const nouveau: Coin = `${haut ? "haut" : "bas"}-${gauche ? "gauche" : "droite"}`
    setCoin(nouveau)
    setGlisse(null)
    try {
      localStorage.setItem(CLE, nouveau)
    } catch {}
  }

  return (
    <a
      href={LIEN}
      target="_blank"
      rel="noreferrer"
      aria-label={t.instagram.label}
      title={t.instagram.label}
      draggable={false}
      onPointerDown={appui}
      onPointerMove={deplacement}
      onPointerUp={relache}
      onPointerCancel={() => {
        depart.current = null
        setGlisse(null)
      }}
      onClick={(e) => {
        // Après un glisser, on ne suit pas le lien
        if (aGlisse.current) {
          e.preventDefault()
          aGlisse.current = false
        }
      }}
      style={glisse ? { left: glisse.x - 26, top: glisse.y - 26 } : undefined}
      className={cn(
        "fixed z-40 flex size-13 touch-none items-center justify-center select-none print:hidden",
        glisse
          ? "scale-110 cursor-grabbing"
          : cn(PLACE[coin], "animate-in fade-in zoom-in-75 cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95")
      )}
    >
      {/* Logo Instagram (fond transparent) */}
      <Image
        src="/instagram.png"
        alt=""
        width={52}
        height={52}
        draggable={false}
        className="pointer-events-none size-full drop-shadow-[0_4px_10px_rgb(0_0_0/0.25)]"
      />
    </a>
  )
}
