import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * Lien reçu par e-mail (confirmation du compte ou mot de passe oublié) :
 * ouvre la session puis envoie vers la bonne page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  // Page où aller ensuite (seulement une page de ce site)
  const suite = searchParams.get("suite")
  const destination =
    suite?.startsWith("/") && !suite.startsWith("//")
      ? suite
      : type === "recovery"
        ? "/nouveau-mot-de-passe"
        : "/accueil"

  const supabase = await createClient()
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${destination}`)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return NextResponse.redirect(`${origin}${destination}`)
  }

  return NextResponse.redirect(`${origin}/connexion?erreur=lien`)
}
