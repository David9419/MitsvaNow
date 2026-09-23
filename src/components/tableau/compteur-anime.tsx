"use client"

import { useEffect, useRef, useState } from "react"

/** Un nombre qui « défile » jusqu'à sa valeur. */
export function CompteurAnime({ valeur, duree = 900 }: { valeur: number; duree?: number }) {
  const [affiche, setAffiche] = useState(0)
  const depart = useRef(0)

  useEffect(() => {
    const de = depart.current
    const debut = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - debut) / duree)
      const ease = 1 - Math.pow(1 - p, 3)
      setAffiche(Math.round(de + (valeur - de) * ease))
      if (p < 1) raf = requestAnimationFrame(tick)
      else depart.current = valeur
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [valeur, duree])

  return <>{affiche}</>
}
