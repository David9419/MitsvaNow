import {
  BookOpen,
  Coins,
  DoorOpen,
  Ear,
  Flame,
  GraduationCap,
  HandHeart,
  Heart,
  Library,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
  Wheat,
  type LucideIcon,
} from "lucide-react"

// Une icône par service du bandeau (même ordre que accueil.services dans les dictionnaires)
const ICONES: LucideIcon[] = [
  ScrollText,
  DoorOpen,
  Wheat,
  Flame,
  Users,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Coins,
  Library,
  Sparkles,
  Heart,
  Ear,
  HandHeart,
]

/** Bandeau des services qui défile à l'infini (deux copies identiques côte à côte). */
export function BandeauServices({ services, label }: { services: string[]; label: string }) {
  return (
    <section
      aria-label={label}
      // Le défilement va toujours dans le même sens, quelle que soit la langue
      dir="ltr"
      className="group relative border-y bg-card/70 py-6 backdrop-blur"
    >
      <div
        className="flex overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        {[0, 1].map((copie) => (
          <ul
            key={copie}
            aria-hidden={copie === 1}
            className="flex shrink-0 animate-defile items-center gap-4 pr-4 group-hover:[animation-play-state:paused]"
          >
            {services.map((nom, i) => {
              const Icone = ICONES[i % ICONES.length]
              return (
                <li
                  key={nom}
                  className="flex items-center gap-3 rounded-full border bg-background px-5 py-2.5 whitespace-nowrap shadow-sm"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icone className="size-4" />
                  </span>
                  <span className="font-medium">{nom}</span>
                </li>
              )
            })}
          </ul>
        ))}
      </div>
    </section>
  )
}
