"use client"

import { useRef, useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { useT } from "@/components/i18n/langue-provider"
import { changerThemeAnime } from "@/lib/theme-anime"
import { cn } from "@/lib/utils"

/** Vrai une fois la page affichée dans le navigateur (le thème n'est connu qu'à ce moment-là). */
const useMonte = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

/**
 * Interrupteur clair / sombre : un ciel de jour (soleil + nuage) qui devient
 * un ciel de nuit (lune + étoiles). Le changement s'ouvre en cercle depuis le bouton.
 */
export function InterrupteurTheme({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useT()
  const monte = useMonte()
  const bouton = useRef<HTMLButtonElement>(null)
  const sombre = monte && resolvedTheme === "dark"

  return (
    <button
      ref={bouton}
      type="button"
      role="switch"
      aria-checked={sombre}
      aria-label={sombre ? t.theme.versClair : t.theme.versSombre}
      title={sombre ? t.theme.versClair : t.theme.versSombre}
      onClick={() => changerThemeAnime(sombre ? "light" : "dark", setTheme, bouton.current)}
      className={cn(
        "group relative inline-flex h-9 w-16 shrink-0 items-center overflow-hidden rounded-full p-1 shadow-inner ring-1 ring-black/5 transition-colors duration-500 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "bg-gradient-to-br from-sky-400 to-sky-200 dark:from-indigo-950 dark:to-slate-800 dark:ring-white/10",
        className
      )}
    >
      {/* Nuage (le jour) */}
      <span
        aria-hidden
        className="absolute end-2 top-2 flex transition-all duration-500 dark:translate-y-6 dark:opacity-0"
      >
        <span className="size-2.5 rounded-full bg-white/90" />
        <span className="-ms-1 mt-0.5 size-3 rounded-full bg-white/90" />
      </span>
      {/* Étoiles (la nuit) */}
      <span aria-hidden className="absolute inset-0 opacity-0 transition-opacity duration-700 dark:opacity-100">
        <span className="absolute start-2.5 top-2 size-0.5 animate-pulse rounded-full bg-white" />
        <span className="absolute start-5 top-5 size-1 animate-pulse rounded-full bg-white/80 [animation-delay:400ms]" />
        <span className="absolute start-3.5 bottom-1.5 size-0.5 animate-pulse rounded-full bg-white/70 [animation-delay:800ms]" />
      </span>
      {/* Le rond qui glisse : soleil puis lune */}
      <span
        className={cn(
          "relative flex size-7 items-center justify-center rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90",
          "bg-white text-amber-500 dark:translate-x-7 dark:bg-slate-200 dark:text-indigo-700 rtl:dark:-translate-x-7"
        )}
      >
        <Sun className="absolute size-4 transition-all duration-500 dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-4 scale-0 rotate-90 transition-all duration-500 dark:scale-100 dark:rotate-0" />
      </span>
    </button>
  )
}

/** Bouton de thème de l'en-tête. */
export function ModeToggle() {
  return <InterrupteurTheme />
}
