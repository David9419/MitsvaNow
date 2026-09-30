import { User } from "lucide-react"

import { cn } from "@/lib/utils"

/** Photo ronde d'une personne (ou son initiale / une icône si elle n'en a pas). */
export function Avatar({
  src,
  nom,
  className,
}: {
  src?: string | null
  nom?: string | null
  className?: string
}) {
  const initiale = nom?.trim().charAt(0).toUpperCase()
  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground ring-2 ring-background",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo stockée chez Supabase
        <img src={src} alt={nom ?? ""} className="size-full object-cover" loading="lazy" />
      ) : initiale ? (
        <span className="font-heading text-[0.9em] font-bold">{initiale}</span>
      ) : (
        <User className="size-1/2" />
      )}
    </span>
  )
}
