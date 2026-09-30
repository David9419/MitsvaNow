import Link from "next/link"

import { Logo } from "@/components/logo"
import { ModeToggle } from "@/components/mode-toggle"
import { SelecteurLangue } from "@/components/selecteur-langue"
import { Button } from "@/components/ui/button"
import { obtenirDico } from "@/lib/i18n/serveur"
import { utilisateurConnecte } from "@/lib/supabase/utilisateur"

export async function SiteHeader() {
  const [user, t] = await Promise.all([utilisateurConnecte(), obtenirDico()])
  const liens = [
    { href: "/#comment", label: t.nav.comment },
    { href: "/#espaces", label: t.nav.espaces },
    { href: "/#faq", label: t.nav.faq },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative transition-colors after:absolute after:-bottom-1 after:start-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:text-foreground hover:after:scale-x-100 rtl:after:origin-right"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link href="/accueil">{t.commun.monEspace}</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link href="/connexion">{t.commun.seConnecter}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inscription">{t.commun.sInscrire}</Link>
              </Button>
            </>
          )}
          <SelecteurLangue />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
