import {
  BookOpen,
  CookingPot,
  Flame,
  HeartHandshake,
  Leaf,
  Megaphone,
  Scale,
  ScrollText,
  ShieldCheck,
  Wheat,
} from "lucide-react"

const services = [
  { nom: "Téfilines", icon: ScrollText },
  { nom: "'Hallot pour Chabbat", icon: Wheat },
  { nom: "Cachérisation", icon: CookingPot },
  { nom: "Cours de Torah", icon: BookOpen },
  { nom: "Bougies de Chabbat", icon: Flame },
  { nom: "Vérification de téfilines", icon: ShieldCheck },
  { nom: "Question de halakha", icon: Scale },
  { nom: "Loulav & étrog", icon: Leaf },
  { nom: "Chofar", icon: Megaphone },
  { nom: "Accompagnement", icon: HeartHandshake },
]

/** Bandeau des services qui défile à l'infini (deux copies identiques côte à côte). */
export function BandeauServices() {
  return (
    <section
      aria-label="Exemples de services"
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
            {services.map((s) => (
              <li
                key={s.nom}
                className="flex items-center gap-3 rounded-full border bg-background px-5 py-2.5 whitespace-nowrap shadow-sm"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <s.icon className="size-4" />
                </span>
                <span className="font-medium">{s.nom}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}
