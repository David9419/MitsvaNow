"use server"

import { refresh } from "next/cache"
import { cookies } from "next/headers"

import { COOKIE_LANGUE, estLangue } from "@/lib/i18n/langues"
import { createClient } from "@/lib/supabase/server"

/** Change la langue de tout le site (et la retient dans le profil, pour les notifications). */
export async function changerLangue(langue: string) {
  if (!estLangue(langue)) return
  ;(await cookies()).set(COOKIE_LANGUE, langue, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) await supabase.rpc("definir_langue", { p_langue: langue })
  } catch {
    // pas grave : la langue du site est déjà changée
  }
  refresh()
}
