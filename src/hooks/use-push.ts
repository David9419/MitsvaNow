"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { activerPush, testerPush, verifierPush, type EtatPush } from "@/lib/tableau/push"
import { messageErreur } from "@/lib/tableau/outils"

/** Notifications sur le téléphone (même site fermé) : état + actions. */
export function usePush() {
  const [supabase] = useState(() => createClient())
  const [etat, setEtat] = useState<EtatPush>("chargement")

  useEffect(() => {
    verifierPush(supabase).then(setEtat)
  }, [supabase])

  const activer = useCallback(
    async (silencieux = false) => {
      try {
        const e = await activerPush(supabase)
        setEtat(e)
        if (silencieux) return e
        if (e === "actif")
          toast.success("Notifications activées", {
            description: "Vous recevrez les demandes même quand le site est fermé.",
          })
        else if (e === "refuse")
          toast.error("Notifications bloquées", {
            description: "Autorisez-les dans les réglages du téléphone ou du navigateur.",
          })
        return e
      } catch (err) {
        if (!silencieux) toast.error(messageErreur(err))
        return "inactif" as const
      }
    },
    [supabase]
  )

  const tester = useCallback(async () => {
    try {
      const n = await testerPush(supabase)
      if (n === 0) {
        toast.error("Aucun appareil enregistré", { description: "Activez d'abord les notifications." })
        return
      }
      toast.success(n > 1 ? `Notification envoyée à ${n} appareils` : "Notification envoyée", {
        description: "Elle doit apparaître tout de suite sur votre téléphone.",
      })
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }, [supabase])

  return { etat, activer, tester }
}
