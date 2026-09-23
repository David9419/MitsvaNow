import Link from "next/link"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"

const liens = [
  { href: "/#comment", label: "Comment ça marche" },
  { href: "/#espaces", label: "Les espaces" },
  { href: "/#rejoindre", label: "Devenir intervenant" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-heading text-lg font-bold">
          <span className="text-foreground">Mivtsa</span>{" "}
          <span className="text-primary">Now</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/#espaces">Faire une demande</Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
