"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Ban, Loader2 } from "lucide-react"

import { Avatar } from "@/components/avatar"
import { useLangue, useT } from "@/components/i18n/langue-provider"
import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { Button } from "@/components/ui/button"
import { ilYa } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { messageErreur } from "@/lib/tableau/outils"

type Bloque = { id: string; prenom: string; nom: string | null; photo: string | null; depuis: string }

/** Paramètres : la liste des personnes bloquées, avec « Débloquer ». */
export function PersonnesBloquees() {
  const t = useT()
  const p = t.signalement.parametres
  const langue = useLangue()
  const supabase = useRef(createClient()).current
  const [liste, setListe] = useState<Bloque[] | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)

  const charger = useCallback(async () => {
    const { data } = await supabase.rpc("mes_blocages")
    setListe((data as unknown as Bloque[]) ?? [])
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  const debloquer = async (b: Bloque) => {
    setEnCours(b.id)
    const { error } = await supabase.rpc("debloquer_personne", { p_personne: b.id })
    setEnCours(null)
    if (error) return toast.error(messageErreur(error, t))
    toast.success(p.debloque(b.prenom))
    charger()
  }

  return (
    <CarteWidget icon={Ban} titre={p.titre} sousTitre={p.sousTitre} delai={375}>
      {liste === null ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : liste.length === 0 ? (
        <p className="text-sm text-muted-foreground">{p.vide}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {liste.map((b) => {
            const nom = [b.prenom, b.nom].filter(Boolean).join(" ")
            return (
              <li key={b.id} className="flex items-center gap-3">
                <Avatar src={b.photo} nom={nom} className="size-9 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{nom}</p>
                  <p className="text-xs text-muted-foreground">{p.depuis(ilYa(b.depuis, langue))}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => debloquer(b)} disabled={enCours === b.id}>
                  {enCours === b.id && <Loader2 className="animate-spin" />} {p.debloquer}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </CarteWidget>
  )
}
