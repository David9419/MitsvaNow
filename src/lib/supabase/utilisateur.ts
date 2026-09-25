import { createClient } from "@/lib/supabase/server"

/** Renvoie l'utilisateur connecté, ou null (même si Supabase est injoignable). */
export async function utilisateurConnecte() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}
