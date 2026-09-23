import { Logo } from "@/components/logo"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
        <Logo />
        <p>© {new Date().getFullYear()} Mivtsa Now — Tous droits réservés.</p>
      </div>
    </footer>
  )
}
