"use client"

import { useEffect, useState } from "react"
import { Loader2, LocateFixed, MapPin, Moon, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { villeDePosition } from "@/lib/tableau/adresses"
import { prochainChabbat } from "@/lib/tableau/soleil"

const PARIS = { lat: 48.8566, lng: 2.3522, ville: "Paris" }

function deux(n: number) {
  return String(n).padStart(2, "0")
}

/** Une bougie de Chabbat avec sa flamme qui vacille. */
function Bougie({ delai = "0s" }: { delai?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-14 w-8">
        <span className="absolute bottom-0 left-1/2 size-16 -translate-x-1/2 translate-y-4 rounded-full bg-accent/40 blur-2xl" />
        <span
          className="flamme absolute bottom-0 left-1/2 h-12 w-6 -translate-x-1/2 rounded-[50%_50%_45%_45%/60%_60%_40%_40%] bg-gradient-to-t from-accent via-accent to-background shadow-[0_0_30px_var(--accent)]"
          style={{ animationDelay: delai }}
        />
      </div>
      <span className="h-1.5 w-0.5 bg-current opacity-60" />
      <span className="h-28 w-8 rounded-t-md bg-gradient-to-b from-background to-background/80 shadow-inner" />
      <span className="h-3 w-14 rounded-md bg-current opacity-30" />
    </div>
  )
}

/** Compte à rebours avant Chabbat, avec l'heure d'entrée et de sortie. */
export function CompteurChabbat() {
  const [maintenant, setMaintenant] = useState<Date | null>(null)
  const [lieu, setLieu] = useState(PARIS)
  const [recherche, setRecherche] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- horloge démarrée côté navigateur
    setMaintenant(new Date())
    const t = setInterval(() => setMaintenant(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const localiser = () => {
    if (!navigator.geolocation) return
    setRecherche(true)
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude: lat, longitude: lng } = p.coords
        setLieu({ lat, lng, ville: "Votre position" })
        setRecherche(false)
        const v = await villeDePosition(lat, lng)
        if (v) setLieu({ lat, lng, ville: v })
      },
      () => setRecherche(false),
      { timeout: 15000 }
    )
  }

  // Si la localisation est déjà autorisée, on l'utilise sans rien demander
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((p) => p.state === "granted" && localiser())
      .catch(() => {})
  }, [])

  const chabbat = maintenant ? prochainChabbat(maintenant, lieu.lat, lieu.lng) : null
  const cible = chabbat ? (chabbat.enCours ? chabbat.sortie : chabbat.allumage) : null
  const diff = maintenant && cible ? Math.max(0, (cible.getTime() - maintenant.getTime()) / 1000) : 0
  const blocs = [
    { v: Math.floor(diff / 86400), l: "jours" },
    { v: Math.floor((diff % 86400) / 3600), l: "heures" },
    { v: Math.floor((diff % 3600) / 60), l: "minutes" },
    { v: Math.floor(diff % 60), l: "secondes" },
  ]
  const jourHeure = (d: Date) =>
    `${d.toLocaleDateString("fr-FR", { weekday: "long" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-foreground p-8 text-background shadow-2xl sm:p-12 dark:bg-card dark:text-card-foreground">
      {/* Ciel étoilé */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 size-96 animate-blob rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 animate-blob rounded-full bg-primary/30 blur-3xl" style={{ animationDelay: "-7s" }} />
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute size-1 animate-pulse rounded-full bg-current opacity-40"
            style={{ top: `${(i * 37) % 100}%`, left: `${(i * 61) % 100}%`, animationDelay: `${(i % 7) * 0.4}s` }}
          />
        ))}
      </div>

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-sm font-semibold text-accent">
            <Sparkles className="size-4" /> Chabbat Chalom
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
            {chabbat?.enCours ? "C'est Chabbat ! Fin dans…" : "Chabbat commence dans…"}
          </h2>

          <div className="mt-8 grid grid-cols-4 gap-3 sm:gap-4">
            {blocs.map((b) => (
              <div key={b.l} className="rounded-2xl bg-current/10 p-3 text-center ring-1 ring-current/15 backdrop-blur sm:p-4">
                <p key={b.v} className="chiffre-flou font-heading text-3xl font-bold tabular-nums sm:text-5xl">
                  {maintenant ? deux(b.v) : "--"}
                </p>
                <p className="mt-1 text-[11px] tracking-wide uppercase opacity-70 sm:text-xs">{b.l}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-current/10 p-4 ring-1 ring-current/15">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-xs uppercase opacity-70">Allumage des bougies</p>
                <p className="font-semibold capitalize">{chabbat ? jourHeure(chabbat.allumage) : "…"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-current/10 p-4 ring-1 ring-current/15">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Moon className="size-5" />
              </span>
              <div>
                <p className="text-xs uppercase opacity-70">Fin de Chabbat</p>
                <p className="font-semibold capitalize">{chabbat ? jourHeure(chabbat.sortie) : "…"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 opacity-80">
              <MapPin className="size-4" /> {lieu.ville}
            </span>
            {lieu === PARIS && (
              <Button
                size="sm"
                variant="secondary"
                onClick={localiser}
                disabled={recherche}
                className="bg-current/10 text-inherit hover:bg-current/20"
              >
                {recherche ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                Horaires de ma ville
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs opacity-60">
            Horaires indicatifs : allumage 18 min avant le coucher du soleil, sortie 42 min après.
            Suivez l&apos;usage de votre communauté.
          </p>
        </div>

        <div className="hidden items-end justify-center gap-8 lg:flex">
          <Bougie />
          <Bougie delai="-0.8s" />
        </div>
      </div>
    </div>
  )
}
