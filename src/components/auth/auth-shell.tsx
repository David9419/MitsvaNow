import Image from "next/image"
import type { ReactNode } from "react"
import { MapPin, ShieldCheck, Sparkles } from "lucide-react"

import { ESPACES } from "@/lib/espaces"

const points = [
  { icon: MapPin, titre: "Au plus près de vous", texte: "L'intervenant disponible le plus proche est prévenu en quelques secondes." },
  { icon: ShieldCheck, titre: "Des intervenants engagés", texte: "Bahourim, équipe féminine, rabbanim et chlou'him près de chez vous." },
  { icon: Sparkles, titre: "Simple et gratuit", texte: "Ouvert à tous, quel que soit votre niveau." },
]

/** Mise en page des pages de connexion / inscription : présentation à gauche, formulaire à droite. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid flex-1 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1fr_1.1fr]">
      {/* ---------- Présentation (grand écran) ---------- */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:sticky lg:top-16 lg:flex lg:h-[calc(100svh-4rem)] lg:self-start dark:bg-card dark:text-card-foreground">
        {/* Décor : quadrillage léger, halos et ondes radar */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--primary-foreground)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--primary-foreground)_8%,transparent)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <div className="absolute -top-32 -left-32 size-[28rem] animate-blob rounded-full bg-accent/25 blur-3xl" />
          <div
            className="absolute -right-32 -bottom-32 size-[28rem] animate-blob rounded-full bg-primary-foreground/15 blur-3xl"
            style={{ animationDelay: "-6s" }}
          />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute top-[22%] left-[22%] size-[34rem] -translate-x-1/2 -translate-y-1/2 animate-radar rounded-full border border-primary-foreground/25"
              style={{ animationDelay: `${i}s` }}
            />
          ))}
        </div>

        <div className="relative flex w-full flex-col justify-between gap-8 overflow-y-auto p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="rounded-2xl bg-card p-3 shadow-xl dark:bg-background">
              <Image src="/logo-mark.png" alt="" width={64} height={56} className="h-12 w-auto" />
            </div>
            <p className="font-heading text-2xl font-bold">
              Mivtsa <span className="text-accent">Now</span>
            </p>
          </div>

          {/* Phrase d'accroche */}
          <div className="max-w-md">
            <h2 className="animate-in fade-in slide-in-from-bottom-4 text-4xl leading-tight font-bold delay-150 duration-700 fill-mode-both xl:text-5xl">
              Une mitsva ?<br />
              <span className="text-accent">Quelqu&apos;un arrive.</span>
            </h2>
            <p className="animate-in fade-in mt-5 text-lg opacity-85 delay-300 duration-700 fill-mode-both">
              Téfilines, mezouza, &apos;hallot, bar-mitsva… Mivtsa Now
              vous met en relation avec l&apos;intervenant le plus proche.
            </p>

            <ul className="mt-10 flex flex-col gap-5">
              {points.map((p, i) => (
                <li
                  key={p.titre}
                  className="animate-in fade-in slide-in-from-left-4 flex gap-4 duration-700 fill-mode-both"
                  style={{ animationDelay: `${450 + i * 150}ms` }}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20 dark:bg-primary/15 dark:text-primary dark:ring-primary/30">
                    <p.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{p.titre}</p>
                    <p className="text-sm opacity-75">{p.texte}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Les 4 espaces */}
          <div className="animate-in fade-in delay-1000 duration-700 fill-mode-both">
            <p className="mb-3 text-xs font-semibold tracking-widest uppercase opacity-70">
              5 espaces
            </p>
            <div className="grid w-fit grid-cols-2 gap-2">
              {ESPACES.map((e) => (
                <span
                  key={e.slug}
                  className="flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1.5 text-sm ring-1 ring-primary-foreground/15 dark:bg-primary/10 dark:ring-primary/25"
                >
                  <e.icon className="size-4" />
                  {e.nom}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ---------- Formulaire ---------- */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-6 w-full max-w-md duration-700">
          {/* Logo sur petit écran */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Image src="/logo-mark.png" alt="Mivtsa Now" width={80} height={70} className="h-16 w-auto animate-float" />
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
