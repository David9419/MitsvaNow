"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowRight, Menu, X } from "lucide-react"

import { ModeToggle } from "@/components/mode-toggle"
import { SelecteurLangue } from "@/components/selecteur-langue"
import { useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Lien = { href: string; label: string }

/**
 * Menu du téléphone : un bouton « ☰ » qui ouvre un panneau sous l'en-tête
 * avec les liens, la connexion / l'inscription, la langue et le thème.
 * Caché à partir des écrans moyens (le menu classique s'affiche alors).
 */
export function MenuMobile({ liens, connecte }: { liens: Lien[]; connecte: boolean }) {
  const t = useT()
  const pathname = usePathname()
  const [ouvert, setOuvert] = useState(false)
  const [pageOuverte, setPageOuverte] = useState(pathname)

  // On ferme le menu quand on change de page
  if (pageOuverte !== pathname) {
    setPageOuverte(pathname)
    setOuvert(false)
  }

  // Touche Échap + on bloque le défilement de la page derrière le menu
  useEffect(() => {
    if (!ouvert) return
    const auClavier = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false)
    const avant = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", auClavier)
    return () => {
      document.body.style.overflow = avant
      window.removeEventListener("keydown", auClavier)
    }
  }, [ouvert])

  const fermer = () => setOuvert(false)

  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="icon"
        aria-label={ouvert ? t.nav.fermerMenu : t.nav.menu}
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        onClick={() => setOuvert((o) => !o)}
        className="relative rounded-full hover:bg-muted hover:text-foreground"
      >
        <Menu className={cn("transition-all duration-300", ouvert && "scale-50 rotate-90 opacity-0")} />
        <X className={cn("absolute transition-all duration-300", !ouvert && "scale-50 -rotate-90 opacity-0")} />
      </Button>

      {ouvert && (
        <>
          {/* Voile : toucher à côté ferme le menu */}
          <div
            aria-hidden
            onClick={fermer}
            className="fixed inset-x-0 top-16 bottom-0 z-30 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200"
          />
          <nav
            id="menu-mobile"
            className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b bg-background px-4 pt-2 pb-6 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <ul className="flex flex-col">
              {liens.map((l, i) => (
                <li
                  key={l.href}
                  className="animate-in fade-in slide-in-from-top-1 fill-mode-both"
                  style={{ animationDelay: `${60 + i * 40}ms` }}
                >
                  <Link
                    href={l.href}
                    onClick={fermer}
                    className="flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-medium transition-colors hover:bg-muted active:bg-muted"
                  >
                    {l.label}
                    <ArrowRight className="size-4 text-muted-foreground rtl:-scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-3 grid gap-2 border-t pt-4">
              {connecte ? (
                <Button asChild size="lg">
                  <Link href="/accueil" onClick={fermer}>
                    {t.commun.monEspace}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/inscription" onClick={fermer}>
                      {t.commun.sInscrire}
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/connexion" onClick={fermer}>
                      {t.commun.seConnecter}
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <SelecteurLangue />
              <ModeToggle />
            </div>
          </nav>
        </>
      )}
    </div>
  )
}
