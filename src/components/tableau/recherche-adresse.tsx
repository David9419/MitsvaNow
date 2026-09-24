"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin, Search } from "lucide-react"

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
        const r = await chercherAdresses(texte, ctrl.current.signal)
        setSuggestions(r)
        setAucune(r.length === 0)
      } catch {
        // recherche annulée
      } finally {
        setCherche(false)
      }
    }, 450)
    return () => clearTimeout(t)
  }, [texte, choisie])

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={texte}
        autoFocus={autoFocus}
        onChange={(e) => {
          setTexte(e.target.value)
          setChoisie(null)
        }}
        placeholder="Tapez votre adresse (ex. 12 rue de Rivoli, Paris)"
        className="h-12 bg-card pl-10"
      />
      {cherche && <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {aucune && !cherche && (
        <p className="mt-2 text-xs text-muted-foreground">Aucune adresse trouvée. Essayez avec la ville.</p>
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
  )
}
