import { MapPin, User } from "lucide-react"

/** Illustration animée : la demande au centre, les intervenants autour. */
const intervenants = [
  { top: "18%", left: "68%", delay: "0s", nearest: false },
  { top: "62%", left: "20%", delay: "0.8s", nearest: false },
  { top: "38%", left: "34%", delay: "0.4s", nearest: true },
  { top: "74%", left: "72%", delay: "1.2s", nearest: false },
]

export function Radar() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* Cercles de portée */}
      {[100, 72, 44].map((size) => (
        <div
          key={size}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20"
          style={{ width: `${size}%`, height: `${size}%` }}
        />
      ))}

      {/* Balayage radar */}
      <div className="absolute inset-0 animate-sweep rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,var(--primary)_360deg)] opacity-20" />

      {/* Ondes */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 animate-radar rounded-full border-2 border-primary/50"
          style={{ animationDelay: `${i}s` }}
        />
      ))}

      {/* Ligne vers l'intervenant le plus proche */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <line
          x1="50"
          y1="50"
          x2="38"
          y2="42"
          className="stroke-success"
          strokeWidth="0.8"
          strokeDasharray="2 1.5"
        />
      </svg>

      {/* Intervenants */}
      {intervenants.map((p, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 animate-float"
          style={{ top: p.top, left: p.left, animationDelay: p.delay }}
        >
          <div
            className={
              p.nearest
                ? "flex size-11 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg ring-4 ring-success/25"
                : "flex size-9 items-center justify-center rounded-full bg-card text-muted-foreground shadow-md ring-1 ring-border"
            }
          >
            <User className="size-4" />
          </div>
          {p.nearest && (
            <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-success-foreground">
              Le plus proche
            </span>
          )}
        </div>
      ))}

      {/* Demandeur au centre */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-8 ring-primary/20">
          <MapPin className="size-6" />
        </div>
      </div>
    </div>
  )
}
