import { Logo } from "@/components/logo"
import { obtenirDico } from "@/lib/i18n/serveur"

export async function SiteFooter() {
  const t = await obtenirDico()
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
        <Logo />
        <p>
          © {new Date().getFullYear()} Mivtsa Now — {t.commun.tousDroits}
        </p>
      </div>
    </footer>
  )
}
