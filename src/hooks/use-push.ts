"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { useT } from "@/components/i18n/langue-provider"
import { createClient } from "@/lib/supabase/client"
import { activerPush, desactiverPush, testerPush, verifierPush, type EtatPush } from "@/lib/tableau/push"
import { messageErreur } from "@/lib/tableau/outils"

/** Notifications sur le téléphone (même site fermé) : état + actions. */
export function usePush() {
  const t = useT()
  const n = t.notifications
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
        if (e === "actif") toast.success(n.toastActivees, { description: n.toastActiveesTexte })
        else if (e === "refuse") toast.error(n.toastBloquees, { description: n.toastBloqueesTexte })
        return e
      } catch (err) {
        if (!silencieux) toast.error(messageErreur(err, t))
        return "inactif" as const
      }
    },
    [supabase, n, t]
  )

  const desactiver = useCallback(async () => {
    try {
      await desactiverPush(supabase)
      setEtat("inactif")
      toast(n.toastDesactivees, { description: n.toastDesactiveesTexte })
    } catch (err) {
      toast.error(messageErreur(err, t))
    }
  }, [supabase, n, t])

  const tester = useCallback(async () => {
    try {
      const nb = await testerPush(supabase)
      if (nb === 0) {
        toast.error(n.aucunAppareil, { description: n.aucunAppareilTexte })
        return
      }
      toast.success(nb > 1 ? n.envoyeeA(nb) : n.envoyee, { description: n.envoyeeTexte })
    } catch (err) {
      toast.error(messageErreur(err, t))
    }
  }, [supabase, n, t])

  return { etat, activer, desactiver, tester }
}
