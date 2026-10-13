import Link from "next/link"

import { Logo } from "@/components/logo"
import { EMAIL_CONTACT } from "@/lib/contact"
import { obtenirDico } from "@/lib/i18n/serveur"

export async function SiteFooter() {
  const t = await obtenirDico()
  const l = t.legal.liens
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
        <Logo />
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/confidentialite" className="hover:text-foreground">
            {l.confidentialite}
          </Link>
          <Link href="/conditions" className="hover:text-foreground">
            {l.conditions}
          </Link>
          <a href={`mailto:${EMAIL_CONTACT}`} className="hover:text-foreground">
            {l.contact}
          </a>
        </nav>
        <p>
          © {new Date().getFullYear()} Mivtsa Now — {t.commun.tousDroits}
        </p>
      </div>
    </footer>
  )
}
