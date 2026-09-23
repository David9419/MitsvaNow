import { Check, MapPin, User } from "lucide-react"

/** Durée d'un tour de radar (doit correspondre à --animate-sweep). */
const TOUR_S = 4

/**
 * Intervenants autour de la demande.
 * angle : en degrés, 0 = en haut, sens des aiguilles d'une montre
 * distance : 0 = centre, 50 = bord du radar (en % de la taille)
 */
const intervenants = [
  { angle: 40, distance: 38, nearest: false },
  { angle: 120, distance: 30, nearest: false },
  { angle: 200, distance: 42, nearest: false },
  { angle: 250, distance: 24, nearest: false },
  { angle: 315, distance: 24, nearest: true },
  { angle: 160, distance: 44, nearest: false },
]

function positionner(angle: number, distance: number) {
  const rad = (angle * Math.PI) / 180
  return {
    left: `${50 + distance * Math.sin(rad)}%`,
    top: `${50 - distance * Math.cos(rad)}%`,
  }
}

export function Radar() {
  const plusProche = intervenants.find((p) => p.nearest)!
  const cible = positionner(plusProche.angle, plusProche.distance)

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md select-none">
      {/* Fond du radar */}
      <div className="absolute inset-0 rounded-full bg-card/60 shadow-2xl ring-1 ring-primary/20 backdrop-blur-sm" />

      {/* Cercles de portée + croix */}
      {[100, 75, 50, 25].map((size) => (
        <div
          key={size}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15"
          style={{ width: `${size}%`, height: `${size}%` }}
        />
      ))}
      <div className="absolute top-0 left-1/2 h-full w-px bg-primary/10" />
      <div className="absolute top-1/2 left-0 h-px w-full bg-primary/10" />

      {/* Faisceau qui tourne vraiment */}
      <div className="absolute inset-0 animate-sweep">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,color-mix(in_oklab,var(--primary)_45%,transparent)_360deg)]" />
        <div className="absolute bottom-1/2 left-1/2 h-1/2 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-t from-primary to-transparent shadow-[0_0_12px_var(--primary)]" />
      </div>

      {/* Ondes qui partent du centre */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 animate-radar rounded-full border-2 border-primary/40"
          style={{ animationDelay: `${i}s` }}
        />
      ))}

      {/* Ligne animée vers l'intervenant le plus proche */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
        <line
          x1="50"
          y1="50"
          x2={parseFloat(cible.left)}
          y2={parseFloat(cible.top)}
          className="animate-trajet stroke-success"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
      </svg>

      {/* Intervenants : ils s'allument quand le faisceau passe */}
      {intervenants.map((p, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={positionner(p.angle, p.distance)}
        >
          {p.nearest ? (
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />
              <div className="relative flex size-12 animate-clignote items-center justify-center rounded-full bg-success text-success-foreground shadow-lg ring-4 ring-success/30">
                <User className="size-5" />
              </div>
              <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-success-foreground shadow-md">
                Le plus proche · 350 m
              </span>
            </div>
          ) : (
            <div
              className="flex size-9 animate-blip items-center justify-center rounded-full bg-card text-muted-foreground shadow-md ring-1 ring-border"
              style={{ animationDelay: `${(p.angle / 360) * TOUR_S}s` }}
            >
              <User className="size-4" />
            </div>
          )}
        </div>
      ))}

      {/* La demande, au centre */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-8 ring-primary/20">
          <MapPin className="size-6" />
        </div>
      </div>

      {/* Petites bulles d'information */}
      <div className="absolute -top-2 -left-4 hidden animate-float rounded-2xl bg-card px-4 py-3 shadow-xl ring-1 ring-border sm:block">
        <p className="text-xs text-muted-foreground">Nouvelle demande</p>
        <p className="text-sm font-semibold">Mettre les téfilines</p>
      </div>
      <div
        className="absolute -right-4 -bottom-2 hidden animate-float items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-xl ring-1 ring-border sm:flex"
        style={{ animationDelay: "-3s" }}
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Demande acceptée</p>
          <p className="text-xs text-muted-foreground">Arrivée dans ~5 min</p>
        </div>
      </div>
    </div>
  )
}
