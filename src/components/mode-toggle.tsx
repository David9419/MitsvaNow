"use client"

import { useRef, useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"
import { changerThemeAnime } from "@/lib/theme-anime"

/** Vrai une fois la page affichée dans le navigateur (le thème n'est connu qu'à ce moment-là). */
const useMonte = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

/**
 * Bouton clair / sombre de l'en-tête : un soleil ou une lune.
 * Au clic, le nouveau thème s'ouvre en cercle depuis le bouton.
 */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useT()
  const monte = useMonte()
  const bouton = useRef<HTMLButtonElement>(null)
  const sombre = monte && resolvedTheme === "dark"
  const libelle = sombre ? t.theme.versClair : t.theme.versSombre

  return (
    <Button
      ref={bouton}
      variant="outline"
      size="icon"
      aria-label={libelle}
      title={libelle}
      onClick={() => changerThemeAnime(sombre ? "light" : "dark", setTheme, bouton.current)}
      className="relative overflow-hidden"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all duration-500 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all duration-500 dark:scale-100 dark:rotate-0" />
    </Button>
  )
}
