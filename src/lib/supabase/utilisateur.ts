import { createClient } from "@/lib/supabase/server"

/** Renvoie l'utilisateur connecté, ou null (même si Supabase est injoignable). */
export async function utilisateurConnecte() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null
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
