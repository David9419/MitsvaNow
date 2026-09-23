import Link from "next/link"

import { Logo } from "@/components/logo"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { utilisateurConnecte } from "@/lib/supabase/utilisateur"

const liens = [
  { href: "/#comment", label: "Comment ça marche" },
  { href: "/#espaces", label: "Les espaces" },
  { href: "/#faq", label: "FAQ" },
]

export async function SiteHeader() {
  const user = await utilisateurConnecte()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:text-foreground hover:after:scale-x-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link href="/accueil">Mon espace</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link href="/connexion">Se connecter</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inscription">S&apos;inscrire</Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
