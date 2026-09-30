"use client"

import { useEffect, useId, useRef, useState, type PointerEvent } from "react"

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

/** Le logo Instagram (dégradé officiel). */
function LogoInstagram({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-a`} cx="0.3" cy="1.07" r="1.3">
          <stop offset="0" stopColor="#FFDD55" />
          <stop offset="0.1" stopColor="#FFDD55" />
          <stop offset="0.5" stopColor="#FF543E" />
          <stop offset="1" stopColor="#C837AB" />
        </radialGradient>
        <radialGradient id={`${id}-b`} cx="-0.17" cy="0.07" r="0.6">
          <stop offset="0" stopColor="#3771C8" />
          <stop offset="0.13" stopColor="#3771C8" />
          <stop offset="1" stopColor="#6600FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${id}-a)`} />
      <rect width="48" height="48" rx="12" fill={`url(#${id}-b)`} />
      <rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" strokeWidth="3.2" />
      <circle cx="24" cy="24" r="6.2" fill="none" stroke="#fff" strokeWidth="3.2" />
      <circle cx="31.6" cy="16.4" r="1.9" fill="#fff" />
    </svg>
  )
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
        "group fixed z-40 flex size-13 touch-none items-center justify-center rounded-2xl bg-card/80 p-1 shadow-xl ring-1 ring-border backdrop-blur-md select-none print:hidden",
        glisse
          ? "scale-110 cursor-grabbing shadow-2xl"
          : cn(PLACE[coin], "animate-in fade-in zoom-in-75 cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95")
      )}
    >
      <span aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-[#FF543E]/20 [animation-duration:3s]" />
      <LogoInstagram className="size-full drop-shadow-sm" />
    </a>
  )
}
