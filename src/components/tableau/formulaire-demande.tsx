"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Loader2, LocateFixed, MapPin, Search, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Position } from "@/hooks/use-localisation"
import { ESPACES_SERVICES } from "@/lib/espaces"
import { adresseDePosition, chercherAdresses, type Suggestion } from "@/lib/tableau/adresses"
import { cn } from "@/lib/utils"

export type ServiceDisponible = { id: string; nom: string; espace_slug: string }

/** Numéro d'étape (devient une coche quand l'étape est faite). */
function Etape({ n, titre, fait }: { n: number; titre: string; fait: boolean }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs transition-all duration-300",
          fait ? "bg-success text-success-foreground" : "bg-primary/10 text-primary"
        )}
      >
        {fait ? <Check className="size-3.5 animate-in zoom-in" /> : n}
      </span>
      {titre}
    </p>
  )
}

/** Formulaire en 4 étapes : espace → service → lieu → message. */
export function FormulaireDemande({
  services,
  position,
  etatLocalisation,
  onActiverLocalisation,
  onEnvoyer,
}: {
  services: ServiceDisponible[]
  position: Position | null
  etatLocalisation: string
  onActiverLocalisation: () => Promise<Position | null>
  onEnvoyer: (d: { service: string; lat: number; lng: number; adresse: string | null; message: string }) => Promise<boolean>
}) {
  const [espace, setEspace] = useState<string>("")
  const [service, setService] = useState<string>("")
  const [mode, setMode] = useState<"gps" | "adresse">("gps")
  const [adresseGps, setAdresseGps] = useState<string | null>(null)
  const [recherche, setRecherche] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [choisie, setChoisie] = useState<Suggestion | null>(null)
  const [cherche, setCherche] = useState(false)
  const [message, setMessage] = useState("")
  const [envoi, setEnvoi] = useState(false)

  // Adresse lisible de la position GPS
  useEffect(() => {
    if (!position) return
    let annule = false
    adresseDePosition(position.lat, position.lng).then((a) => !annule && setAdresseGps(a))
    return () => {
      annule = true
    }
  }, [position])

  // Suggestions d'adresses pendant la saisie
  const ctrl = useRef<AbortController | null>(null)
  useEffect(() => {
    if (mode !== "adresse" || recherche.trim().length < 4 || choisie?.libelle === recherche) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- on vide la liste quand la saisie est trop courte
      setSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      ctrl.current?.abort()
      ctrl.current = new AbortController()
      setCherche(true)
      try {
        setSuggestions(await chercherAdresses(recherche, ctrl.current.signal))
      } catch {
        // recherche annulée
      } finally {
        setCherche(false)
      }
    }, 450)
    return () => clearTimeout(t)
  }, [recherche, mode, choisie])

  const servicesEspace = services.filter((s) => s.espace_slug === espace)
  const lieu =
    mode === "gps"
      ? position && { lat: position.lat, lng: position.lng, adresse: adresseGps }
      : choisie && { lat: choisie.lat, lng: choisie.lng, adresse: choisie.libelle }
  const pret = Boolean(service && lieu)

  const envoyer = async () => {
    if (!lieu || !service) return
    setEnvoi(true)
    const ok = await onEnvoyer({ service, lat: lieu.lat, lng: lieu.lng, adresse: lieu.adresse, message })
    setEnvoi(false)
    if (ok) {
      setService("")
      setEspace("")
      setMessage("")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Espace */}
      <div>
        <Etape n={1} titre="De quoi avez-vous besoin ?" fait={!!espace} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ESPACES_SERVICES.map((e) => (
            <button
              key={e.slug}
              type="button"
              onClick={() => {
                setEspace(e.slug)
                setService("")
              }}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-2xl border-2 bg-card p-4 text-center text-sm font-semibold transition-all duration-300 active:scale-95",
                espace === e.slug
                  ? "border-primary shadow-lg shadow-primary/15"
                  : "border-border hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              )}
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                  espace === e.slug ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                )}
              >
                <e.icon className="size-5" />
              </span>
              {e.nom}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Service */}
      {espace && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Etape n={2} titre="Choisissez le service" fait={!!service} />
          <div className="flex flex-wrap gap-2">
            {servicesEspace.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setService(s.id)}
                className={cn(
                  "animate-in fade-in zoom-in-95 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-300 fill-mode-both active:scale-95",
                  service === s.id
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {s.nom}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Lieu */}
      {service && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Etape n={3} titre="Où êtes-vous ?" fait={!!lieu} />
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(
              [
                { id: "gps", label: "Ma position", icon: LocateFixed },
                { id: "adresse", label: "Une adresse", icon: Search },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setMode(o.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all duration-300",
                  mode === o.id ? "bg-card text-primary shadow" : "text-muted-foreground"
                )}
              >
                <o.icon className="size-4" /> {o.label}
              </button>
            ))}
          </div>

          {mode === "gps" ? (
            position ? (
              <div className="flex animate-in fade-in items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
                <MapPin className="size-5 shrink-0 text-success" />
                <span>{adresseGps ?? "Position trouvée"}</span>
              </div>
            ) : (
              <Button variant="outline" onClick={onActiverLocalisation} disabled={etatLocalisation === "demande"} className="w-full">
                {etatLocalisation === "demande" ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                Utiliser ma position actuelle
              </Button>
            )
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value)
                  setChoisie(null)
                }}
                placeholder="Tapez votre adresse (ex. 12 rue de Rivoli, Paris)"
                className="h-12 bg-card pl-10"
              />
              {cherche && <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
              {suggestions.length > 0 && (
                <ul className="absolute z-20 mt-2 w-full animate-in fade-in slide-in-from-top-1 overflow-hidden rounded-xl border bg-popover shadow-xl">
                  {suggestions.map((s) => (
                    <li key={`${s.lat}-${s.lng}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setChoisie(s)
                          setRecherche(s.libelle)
                          setSuggestions([])
                        }}
                        className="flex w-full items-start gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                        {s.libelle}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Message + envoi */}
      {service && lieu && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Etape n={4} titre="Un mot pour l'intervenant (facultatif)" fait={message.length > 0} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Ex. : Je suis disponible cet après-midi, interphone 3B…"
            className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
      )}

      <Button size="lg" disabled={!pret || envoi} onClick={envoyer} className="h-12 text-base shadow-lg shadow-primary/25">
        {envoi ? <Loader2 className="animate-spin" /> : <Send />}
        {envoi ? "Envoi…" : "Envoyer ma demande"}
      </Button>
    </div>
  )
}
