"use client"

import { useEffect, useState } from "react"
import { Flame, ListChecks } from "lucide-react"

import { Checklist } from "@/components/tableau/widgets/checklist"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { prochainChabbat } from "@/lib/tableau/soleil"

const PARIS = { lat: 48.8566, lng: 2.3522 }

function deuxChiffres(n: number) {
  return String(n).padStart(2, "0")
}

/** Équipe féminine : compte à rebours avant Chabbat + préparation. */
export function WidgetChabbat({ position }: { position: { lat: number; lng: number } | null }) {
  const [maintenant, setMaintenant] = useState<Date | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- horloge démarrée côté navigateur
    setMaintenant(new Date())
    const t = setInterval(() => setMaintenant(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const lieu = position ?? PARIS
  const chabbat = maintenant ? prochainChabbat(maintenant, lieu.lat, lieu.lng) : null
  const heure = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  let reste = { j: 0, h: 0, m: 0, s: 0 }
  if (maintenant && chabbat && !chabbat.enCours) {
    const diff = Math.max(0, chabbat.allumage.getTime() - maintenant.getTime()) / 1000
    reste = {
      j: Math.floor(diff / 86400),
      h: Math.floor((diff % 86400) / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: Math.floor(diff % 60),
    }
  }

  return (
    <>
      <CarteWidget
        icon={Flame}
        titre={chabbat?.enCours ? "Chabbat Chalom !" : "Avant Chabbat"}
        sousTitre={position ? "Horaires calculés pour votre position" : "Horaires de Paris (activez la localisation)"}
        delai={200}
      >
        {!chabbat ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : chabbat.enCours ? (
          <div className="rounded-xl bg-accent/15 p-4 text-center">
            <p className="text-4xl">🕯️🕯️</p>
            <p className="mt-2 font-semibold">C&apos;est Chabbat !</p>
            <p className="text-sm text-muted-foreground">Sortie vers {heure(chabbat.sortie)}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { v: reste.j, l: "jours" },
                { v: reste.h, l: "heures" },
                { v: reste.m, l: "min" },
                { v: reste.s, l: "sec" },
              ].map((x) => (
                <div key={x.l} className="rounded-xl bg-accent/15 py-3">
                  <p key={x.v} className="animate-in fade-in slide-in-from-top-1 font-heading text-2xl font-bold tabular-nums duration-300">
                    {deuxChiffres(x.v)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{x.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border p-3 text-sm">
              <span className="flex items-center gap-2">
                <Flame className="size-4 animate-pulse text-accent-foreground dark:text-accent" />
                Allumage des bougies
              </span>
              <span className="font-semibold">
                {chabbat.allumage.toLocaleDateString("fr-FR", { weekday: "long" })} {heure(chabbat.allumage)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Horaires indicatifs (coucher du soleil − 18 min). Vérifiez l&apos;usage de votre communauté.
            </p>
          </>
        )}
      </CarteWidget>

      <CarteWidget icon={ListChecks} titre="Préparation de Chabbat" sousTitre="Pour les 'hallot et les visites" delai={300}>
        <Checklist
          cle="mn-prepa-chabbat"
          elements={["Farine, levure, sucre, sel", "Pâte à 'hallot pétrie", "Bougies et allumettes", "Recette du prélèvement de la 'hala", "Sacs pour les livraisons"]}
        />
      </CarteWidget>
    </>
  )
}
