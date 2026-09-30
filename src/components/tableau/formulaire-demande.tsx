"use client"

import { useEffect, useState } from "react"
import { CalendarClock, Check, Loader2, LocateFixed, MapPin, Pencil, Phone, Search, Send, Zap } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import type { LieuValide } from "@/components/tableau/fenetre-localisation"
import { RechercheAdresse } from "@/components/tableau/recherche-adresse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMaintenant } from "@/hooks/use-maintenant"
import { ESPACES_SERVICES } from "@/lib/espaces"
import { formaterDateHeure, nomService } from "@/lib/i18n"
import type { Suggestion } from "@/lib/tableau/adresses"
import type { NomsService } from "@/lib/tableau/types"
import { cn } from "@/lib/utils"

export type ServiceDisponible = { id: string; nom: string; noms: NomsService | null; espace_slug: string }

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

/** « 2026-10-03 » et « 14:30 » (heure locale) */
const deuxChiffres = (n: number) => String(n).padStart(2, "0")
const jourLocal = (d: Date) => `${d.getFullYear()}-${deuxChiffres(d.getMonth() + 1)}-${deuxChiffres(d.getDate())}`
const heureLocale = (d: Date) => `${deuxChiffres(d.getHours())}:${deuxChiffres(d.getMinutes())}`

/** Proposition par défaut : dans une heure, arrondie au quart d'heure. */
function momentParDefaut() {
  const d = new Date(Date.now() + 60 * 60000)
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
  return d
}

/** Formulaire en 6 étapes : espace → service → quand → lieu → téléphone → message. */
export function FormulaireDemande({
  services,
  lieu: maPosition,
  telephoneParDefaut,
  preselection,
  onModifierLieu,
  onEnvoyer,
}: {
  services: ServiceDisponible[]
  /** Position enregistrée de la personne */
  lieu: LieuValide | null
  telephoneParDefaut: string
  /** Service choisi depuis « Les services » (n change à chaque clic) */
  preselection?: { espace: string; service: string; n: number } | null
  onModifierLieu: () => void
  onEnvoyer: (d: {
    service: string
    lat: number
    lng: number
    adresse: string | null
    telephone: string
    message: string
    programmeePour: string | null
  }) => Promise<boolean>
}) {
  const t = useT()
  const f = t.formulaire
  const langue = useLangue()
  const maintenant = useMaintenant()
  const [espace, setEspace] = useState<string>("")
  const [service, setService] = useState<string>("")
  const [quand, setQuand] = useState<"maintenant" | "programmer">("maintenant")
  const [jour, setJour] = useState("")
  const [heure, setHeure] = useState("")
  const [mode, setMode] = useState<"gps" | "adresse">("gps")
  const [choisie, setChoisie] = useState<Suggestion | null>(null)
  const [telephone, setTelephone] = useState(telephoneParDefaut)

  // Service choisi depuis « Les services » : on remplit les deux premières étapes
  useEffect(() => {
    if (!preselection) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- choix fait dans la liste des services
    setEspace(preselection.espace)
    setService(preselection.service)
  }, [preselection])
  const [message, setMessage] = useState("")
  const [envoi, setEnvoi] = useState(false)

  const choisirProgrammer = () => {
    setQuand("programmer")
    if (!jour || !heure) {
      const d = momentParDefaut()
      setJour(jourLocal(d))
      setHeure(heureLocale(d))
    }
  }

  // Moment choisi : au moins 15 min, au plus ~3 mois
  const moment = quand === "programmer" && jour && heure ? new Date(`${jour}T${heure}`) : null
  const momentValide =
    quand === "maintenant" ||
    (moment != null &&
      !Number.isNaN(moment.getTime()) &&
      moment.getTime() >= maintenant + 15 * 60000 &&
      moment.getTime() <= maintenant + 89 * 86400000)

  const servicesEspace = services.filter((s) => s.espace_slug === espace)
  const lieu =
    mode === "gps" ? maPosition : choisie && { lat: choisie.lat, lng: choisie.lng, adresse: choisie.libelle }
  const telephoneValide = /^[+0-9 ().-]{8,20}$/.test(telephone.trim())
  const pret = Boolean(service && momentValide && lieu && telephoneValide)

  const envoyer = async () => {
    if (!lieu || !service || !momentValide) return
    setEnvoi(true)
    const ok = await onEnvoyer({
      service,
      lat: lieu.lat,
      lng: lieu.lng,
      adresse: lieu.adresse,
      telephone: telephone.trim(),
      message,
      programmeePour: quand === "programmer" && moment ? moment.toISOString() : null,
    })
    setEnvoi(false)
    if (ok) {
      setService("")
      setEspace("")
      setMessage("")
      setQuand("maintenant")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Espace */}
      <div>
        <Etape n={1} titre={f.besoin} fait={!!espace} />
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
              {t.espaces[e.slug].nom}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Service */}
      {espace && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Etape n={2} titre={f.service} fait={!!service} />
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
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {nomService(s.noms, s.nom, langue)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Quand ? */}
      {service && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Etape n={3} titre={f.quand} fait={momentValide} />
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { id: "maintenant", icon: Zap, titre: f.maintenant, texte: f.maintenantTexte },
                { id: "programmer", icon: CalendarClock, titre: f.programmer, texte: f.programmerTexte },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => (o.id === "maintenant" ? setQuand("maintenant") : choisirProgrammer())}
                aria-pressed={quand === o.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border-2 bg-card p-3.5 text-start transition-all duration-300 active:scale-[0.98]",
                  quand === o.id ? "border-primary shadow-lg shadow-primary/15" : "border-border hover:border-primary/40"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    quand === o.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  )}
                >
                  <o.icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{o.titre}</span>
                  <span className="block text-xs text-muted-foreground">{o.texte}</span>
                </span>
              </button>
            ))}
          </div>
          {quand === "programmer" && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-1 rounded-2xl border bg-muted/40 p-3 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
                  {f.jour}
                  <Input
                    type="date"
                    value={jour}
                    min={jourLocal(new Date(maintenant))}
                    max={jourLocal(new Date(maintenant + 89 * 86400000))}
                    onChange={(e) => setJour(e.target.value)}
                    className="h-11 bg-card text-base text-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
                  {f.heure}
                  <Input
                    type="time"
                    value={heure}
                    step={300}
                    onChange={(e) => setHeure(e.target.value)}
                    className="h-11 bg-card text-base text-foreground"
                  />
                </label>
              </div>
              <p
                className={cn(
                  "mt-2 flex items-center gap-2 text-sm font-medium",
                  momentValide ? "text-primary" : "text-destructive"
                )}
              >
                <CalendarClock className="size-4 shrink-0" />
                <span className="first-letter:uppercase">
                  {momentValide && moment ? f.prevu(formaterDateHeure(moment, langue)) : f.dateInvalide}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Lieu */}
      {service && momentValide && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Etape n={4} titre={f.ou} fait={!!lieu} />
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(
              [
                { id: "gps", label: f.maPosition, icon: LocateFixed },
                { id: "adresse", label: f.autreAdresse, icon: Search },
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
            maPosition ? (
              <div className="flex animate-in fade-in items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
                <span className="flex items-center gap-3">
                  <MapPin className="size-5 shrink-0 text-success" />
                  {maPosition.adresse ?? f.positionEnregistree}
                </span>
                <Button size="sm" variant="ghost" onClick={onModifierLieu}>
                  <Pencil /> {t.commun.modifier}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={onModifierLieu} className="w-full">
                <LocateFixed /> {f.meLocaliser}
              </Button>
            )
          ) : (
            <RechercheAdresse onChoisir={setChoisie} />
          )}
        </div>
      )}

      {/* 5. Téléphone */}
      {service && momentValide && lieu && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Etape n={5} titre={f.tel} fait={telephoneValide} />
          <div className="relative">
            <Phone className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder={t.auth.champs.telPh}
              aria-invalid={telephone.length > 0 && !telephoneValide}
              className="h-12 bg-card ps-10"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {telephone.length > 0 && !telephoneValide ? f.telInvalide : f.telAide}
          </p>
        </div>
      )}

      {/* 6. Message + envoi */}
      {service && momentValide && lieu && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Etape n={6} titre={f.mot} fait={message.length > 0} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={f.motPh}
            className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
      )}

      <Button size="lg" disabled={!pret || envoi} onClick={envoyer} className="h-12 text-base shadow-lg shadow-primary/25">
        {envoi ? <Loader2 className="animate-spin" /> : quand === "programmer" ? <CalendarClock /> : <Send className="rtl:-scale-x-100" />}
        {envoi ? f.envoi : quand === "programmer" ? f.envoyerProgrammee : f.envoyer}
      </Button>
    </div>
  )
}
