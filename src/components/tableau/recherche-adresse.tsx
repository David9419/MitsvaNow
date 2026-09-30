"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin, Search } from "lucide-react"

import { useLangue, useT } from "@/components/i18n/langue-provider"
import { Input } from "@/components/ui/input"
import { chercherAdresses, type Suggestion } from "@/lib/tableau/adresses"

/** Champ de recherche d'adresse avec suggestions (OpenStreetMap). */
export function RechercheAdresse({
  onChoisir,
  autoFocus,
}: {
  onChoisir: (s: Suggestion) => void
  autoFocus?: boolean
}) {
  const t = useT()
  const langue = useLangue()
  const [texte, setTexte] = useState("")
  const [choisie, setChoisie] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [cherche, setCherche] = useState(false)
  const [aucune, setAucune] = useState(false)
  const ctrl = useRef<AbortController | null>(null)

  useEffect(() => {
    if (texte.trim().length < 4 || texte === choisie) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- on vide la liste quand la saisie est trop courte
      setSuggestions([])
      setAucune(false)
      return
    }
    const t = setTimeout(async () => {
      ctrl.current?.abort()
      ctrl.current = new AbortController()
      setCherche(true)
      try {
        const r = await chercherAdresses(texte, langue, ctrl.current.signal)
        setSuggestions(r)
        setAucune(r.length === 0)
      } catch {
        // recherche annulée
      } finally {
        setCherche(false)
      }
    }, 450)
    return () => clearTimeout(t)
  }, [texte, choisie, langue])

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={texte}
        autoFocus={autoFocus}
        onChange={(e) => {
          setTexte(e.target.value)
          setChoisie(null)
        }}
        placeholder={t.localisation.placeholder}
        className="h-12 bg-card ps-10"
      />
      {cherche && <Loader2 className="absolute end-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {aucune && !cherche && (
        <p className="mt-2 text-xs text-muted-foreground">{t.localisation.aucune}</p>
      )}
      {suggestions.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full animate-in fade-in slide-in-from-top-1 overflow-hidden rounded-xl border bg-popover shadow-xl">
          {suggestions.map((s) => (
            <li key={`${s.lat}-${s.lng}`}>
              <button
                type="button"
                onClick={() => {
                  setChoisie(s.libelle)
                  setTexte(s.libelle)
                  setSuggestions([])
                  onChoisir(s)
                }}
                className="flex w-full items-start gap-2 px-4 py-3 text-start text-sm transition-colors hover:bg-muted"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {s.libelle}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
