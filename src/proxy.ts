import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config"

// Pages réservées aux personnes connectées.
// (Connexion et inscription restent toujours accessibles : on redemande
// l'e-mail et le mot de passe, ou on crée un autre compte.)
const PAGES_PRIVEES = ["/accueil"]

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rafraîchit la session (ne rien mettre entre createServerClient et getUser)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const redirection = (chemin: string) => {
    const url = request.nextUrl.clone()
    url.pathname = chemin
    url.search = ""
    const r = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => r.cookies.set(c))
    return r
  }

  if (!user && PAGES_PRIVEES.some((p) => pathname.startsWith(p))) {
    return redirection("/connexion")
  }

  return response
}

export const config = {
  matcher: ["/accueil/:path*"],
}
