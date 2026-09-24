"use client"

import { useEffect, useState } from "react"
import { Check, HandHeart, LocateFixed, MapPin, Phone, Search, User, Users } from "lucide-react"

import { ESPACES_SERVICES } from "@/lib/espaces"
import { cn } from "@/lib/utils"

const DUREE = 5500

const ETAPES = [
  { icon: Search, titre: "Dites ce dont vous avez besoin", texte: "Téfilines, mezouza, 'hallot, bar-mitsva… choisissez le service en deux clics." },
  { icon: MapPin, titre: "Partagez votre position", texte: "Autorisez la localisation ou tapez simplement votre adresse." },
  { icon: Users, titre: "On trouve le plus proche", texte: "La plateforme contacte l'intervenant disponible le plus près de vous." },
  { icon: HandHeart, titre: "Il vient vous aider", texte: "L'intervenant accepte et se déplace. Vous suivez tout en direct." },
]

/** Écran 1 : choix du service */
function Ecran1() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-[13px] font-bold">De quoi avez-vous besoin ?</p>
      <div className="grid grid-cols-2 gap-2">
        {ESPACES_SERVICES.map((e, i) => (
          <div
            key={e.slug}
            className="animate-in fade-in zoom-in-95 fill-mode-both"
            style={{ animationDelay: `${150 + i * 90}ms` }}
          >
            <div
              className={cn(
                "flex h-full flex-col items-center gap-1 rounded-xl border-2 bg-card p-2 text-center text-[10px] font-semibold",
                i === 0 && "apercu-choix"
              )}
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <e.icon className="size-3.5" />
              </span>
              {e.nom}
            </div>
          </div>
        ))}
      </div>
      <div className="flex animate-in fade-in slide-in-from-bottom-2 flex-wrap gap-1.5 delay-1000 duration-500 fill-mode-both">
        <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">Mettre les téfilines</span>
        <span className="rounded-full border px-3 py-1 text-[10px]">Mezouza</span>
        <span className="rounded-full border px-3 py-1 text-[10px]">Boîte de tsédaka</span>
      </div>
    </div>
  )
}

/** Écran 2 : position sur une petite carte */
function Ecran2() {
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden bg-[linear-gradient(to_right,color-mix(in_oklab,var(--primary)_10%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_10%,transparent)_1px,transparent_1px)] bg-[size:22px_22px]">
        <div className="absolute top-1/3 -left-4 h-3 w-[140%] -rotate-12 bg-muted" />
        <div className="absolute top-0 left-1/2 h-full w-3 rotate-6 bg-muted" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
          <div className="animate-in slide-in-from-top-12 fade-in duration-700 ease-out">
            <MapPin className="size-10 fill-primary text-primary-foreground drop-shadow-lg" />
          </div>
          <span className="absolute top-full left-1/2 size-3 -translate-x-1/2 animate-ping rounded-full bg-primary/50" />
        </div>
      </div>
      <div className="m-3 flex animate-in fade-in slide-in-from-bottom-4 items-center gap-2 rounded-xl border border-success/40 bg-card p-3 delay-700 duration-500 fill-mode-both">
        <span className="flex size-7 items-center justify-center rounded-full bg-success text-success-foreground">
          <LocateFixed className="size-3.5" />
        </span>
        <div>
          <p className="text-[11px] font-semibold">Position trouvée</p>
          <p className="text-[10px] text-muted-foreground">12 rue de Rivoli, Paris</p>
        </div>
      </div>
    </div>
  )
}

/** Écran 3 : recherche radar */
function Ecran3() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-4">
      <div className="relative size-40">
        {[0, 1, 2].map((i) => (
          <span key={i} className="absolute inset-0 animate-radar rounded-full border-2 border-primary/40" style={{ animationDelay: `${i * 0.8}s` }} />
        ))}
        <div className="absolute inset-0 animate-sweep rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,color-mix(in_oklab,var(--primary)_40%,transparent)_360deg)]" />
        {[
          { t: "18%", l: "70%", d: "0.3s" },
          { t: "68%", l: "22%", d: "0.9s" },
          { t: "30%", l: "28%", d: "1.6s", proche: true },
        ].map((p, i) => (
          <span
            key={i}
            className={cn(
              "absolute flex -translate-x-1/2 -translate-y-1/2 animate-in zoom-in items-center justify-center rounded-full fill-mode-both",
              p.proche ? "size-8 bg-success text-success-foreground ring-4 ring-success/30" : "size-6 bg-card text-muted-foreground ring-1 ring-border"
            )}
            style={{ top: p.t, left: p.l, animationDelay: p.d }}
          >
            <User className="size-3" />
          </span>
        ))}
        <span className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <MapPin className="size-4" />
        </span>
      </div>
      <div className="text-center">
        <p className="text-[12px] font-bold">Recherche du plus proche…</p>
        <p className="mt-1 animate-in fade-in text-[11px] font-semibold text-success delay-[2200ms] fill-mode-both">
          Yossef trouvé à 350 m !
        </p>
      </div>
    </div>
  )
}

/** Écran 4 : l'intervenant arrive */
function Ecran4() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-4">
      <div className="mx-auto flex size-14 animate-in zoom-in items-center justify-center rounded-full bg-success text-success-foreground shadow-lg shadow-success/30 duration-500">
        <Check className="size-7" />
      </div>
      <p className="text-center text-[13px] font-bold">Demande acceptée !</p>
      <div className="flex animate-in fade-in slide-in-from-bottom-4 items-center gap-3 rounded-2xl border bg-card p-3 delay-500 duration-500 fill-mode-both">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-bold">Yossef · Bahour</p>
          <p className="text-[10px] text-muted-foreground">arrive dans ~5 min</p>
        </div>
        <span className="flex size-7 items-center justify-center rounded-full bg-success text-success-foreground">
          <Phone className="size-3" />
        </span>
      </div>
      <div className="animate-in fade-in delay-1000 duration-500 fill-mode-both">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="apercu-trajet h-full rounded-full bg-gradient-to-r from-primary to-success" />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground">
          <span>Acceptée</span>
          <span>En route</span>
          <span>Arrivé</span>
        </div>
      </div>
    </div>
  )
}

const ECRANS = [Ecran1, Ecran2, Ecran3, Ecran4]

/** « Comment ça marche » : les étapes défilent toutes seules sur un téléphone. */
export function ApercuEtapes() {
  const [etape, setEtape] = useState(0)
  const [pause, setPause] = useState(false)

  useEffect(() => {
    if (pause) return
    const t = setTimeout(() => setEtape((e) => (e + 1) % ETAPES.length), DUREE)
    return () => clearTimeout(t)
  }, [etape, pause])

  const Ecran = ECRANS[etape]

  return (
    <div
      className="grid items-center gap-12 lg:grid-cols-2"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {/* Les 4 étapes */}
      <ol className="flex flex-col gap-3">
        {ETAPES.map((e, i) => {
          const actif = i === etape
          return (
            <li key={e.titre}>
              <button
                type="button"
                onClick={() => setEtape(i)}
                className={cn(
                  "group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-500",
                  actif ? "border-primary/40 bg-card shadow-xl shadow-primary/10" : "border-transparent opacity-60 hover:bg-card/60 hover:opacity-100"
                )}
              >
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl transition-all duration-500",
                    actif ? "scale-110 bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-primary/10 text-primary"
                  )}
                >
                  <e.icon className="size-6" />
                </span>
                <span>
                  <span className="text-xs font-bold tracking-widest text-primary uppercase">Étape {i + 1}</span>
                  <span className="mt-1 block font-heading text-base font-bold">{e.titre}</span>
                  <span
                    className={cn(
                      "grid text-sm text-muted-foreground transition-all duration-500",
                      actif ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <span className="overflow-hidden">{e.texte}</span>
                  </span>
                </span>
                {/* Barre de progression de l'étape */}
                <span className="absolute bottom-0 left-0 h-1 w-full bg-muted/60">
                  {actif && (
                    <span
                      key={`${etape}-${pause}`}
                      className="apercu-progression block h-full bg-primary"
                      style={{ animationDuration: `${DUREE}ms`, animationPlayState: pause ? "paused" : "running" }}
                    />
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Le téléphone */}
      <div className="relative mx-auto">
        <div aria-hidden className="absolute -inset-10 animate-blob rounded-full bg-primary/15 blur-3xl" />
        <div className="relative h-[520px] w-[270px] rounded-[2.8rem] border-[10px] border-foreground bg-background shadow-2xl">
          <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-foreground" />
          <div className="flex h-full flex-col overflow-hidden rounded-[2.1rem]">
            <div className="flex items-center justify-between px-5 pt-9 pb-2">
              <span className="font-heading text-[11px] font-bold">
                Mivtsa <span className="text-primary">Now</span>
              </span>
              <span className="flex gap-1">
                {ETAPES.map((_, i) => (
                  <span key={i} className={cn("h-1 rounded-full transition-all duration-500", i === etape ? "w-4 bg-primary" : "w-1 bg-muted-foreground/30")} />
                ))}
              </span>
            </div>
            <div key={etape} className="entree-flou flex-1">
              <Ecran />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
