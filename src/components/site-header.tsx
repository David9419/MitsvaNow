import Link from "next/link"

import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg font-bold">
          <span className="text-foreground">Mivtsa</span>{" "}
          <span className="text-primary">Now</span>
        </Link>
        <ModeToggle />
      </div>
    </header>
  )
}
