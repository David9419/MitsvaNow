import Image from "next/image"
import type { ReactNode } from "react"
import { CheckCircle2 } from "lucide-react"

const points = [
  "L'intervenant le plus proche, en quelques minutes",
  "Des intervenants validés par notre équipe",
  "Gratuit et ouvert à tous",
]

/** Mise en page des pages de connexion / inscription. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-stretch">
      {/* Panneau de gauche (grand écran seulement) */}
      <aside className="relative hidden w-5/12 overflow-hidden bg-primary text-primary-foreground lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 size-96 animate-blob rounded-full bg-accent/30 blur-3xl" />
          <div
            className="absolute -right-24 bottom-0 size-96 animate-blob rounded-full bg-primary-foreground/15 blur-3xl"
            style={{ animationDelay: "-6s" }}
          />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute top-1/3 left-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 animate-radar rounded-full border border-primary-foreground/30"
              style={{ animationDelay: `${i}s` }}
            />
          ))}
        </div>
        <div className="relative m-auto flex max-w-sm flex-col items-start gap-8 p-10">
          <div className="animate-float rounded-3xl bg-card p-5 shadow-2xl">
            <Image src="/logo-mark.png" alt="Mivtsa Now" width={120} height={105} className="h-24 w-auto" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Une mitsva ? Quelqu&apos;un arrive.</h2>
            <p className="mt-3 opacity-85">
              Rejoignez Mivtsa Now et trouvez l&apos;intervenant le plus proche
              de chez vous.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {points.map((p, i) => (
              <li
                key={p}
                className="animate-in fade-in slide-in-from-left-4 flex items-center gap-3 duration-700 fill-mode-both"
                style={{ animationDelay: `${300 + i * 200}ms` }}
              >
                <CheckCircle2 className="size-5 shrink-0 text-accent" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Formulaire */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="animate-in fade-in slide-in-from-bottom-6 w-full max-w-lg duration-700">
          {children}
        </div>
      </div>
    </main>
  )
}
