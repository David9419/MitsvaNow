import Link from "next/link"
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { EMAIL_CONTACT } from "@/lib/contact"
import { obtenirDico } from "@/lib/i18n/serveur"
import { cn } from "@/lib/utils"

/** Remplace « {email} » par un lien vers l'adresse de contact. */
function AvecEmail({ texte }: { texte: string }) {
  const morceaux = texte.split("{email}")
  return (
    <>
      {morceaux.map((m, i) => (
        <span key={i}>
          {m}
          {i < morceaux.length - 1 && (
            <a href={`mailto:${EMAIL_CONTACT}`} className="font-medium text-primary underline-offset-4 hover:underline" dir="ltr">
              {EMAIL_CONTACT}
            </a>
          )}
        </span>
      ))}
    </>
  )
}

/** Page « Politique de confidentialité » ou « Conditions d'utilisation » (dans la langue du site). */
export async function PageLegale({ doc }: { doc: "confidentialite" | "conditions" }) {
  const t = await obtenirDico()
  const l = t.legal
  const d = l[doc]
  const Icone = doc === "confidentialite" ? ShieldCheck : FileText

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
          {l.retour}
        </Link>

        <header className="mt-6 flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icone className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{d.titre}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{l.maj}</p>
          </div>
        </header>

        {/* Passer d'une page à l'autre */}
        <nav className="mt-6 flex gap-1 rounded-xl bg-muted p-1 text-sm">
          {(["confidentialite", "conditions"] as const).map((x) => (
            <Link
              key={x}
              href={`/${x}`}
              aria-current={x === doc ? "page" : undefined}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-center font-semibold transition-all",
                x === doc ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l.liens[x]}
            </Link>
          ))}
        </nav>

        <p className="mt-8 text-base leading-relaxed">{d.intro}</p>

        <div className="mt-8 flex flex-col gap-8">
          {d.sections.map((s) => (
            <section key={s.titre}>
              <h2 className="font-heading text-lg font-bold">{s.titre}</h2>
              {s.texte.map((p) => (
                <p key={p} className="mt-3 leading-relaxed text-muted-foreground">
                  <AvecEmail texte={p} />
                </p>
              ))}
              {s.points.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2 ps-5 text-muted-foreground marker:text-primary [list-style:disc]">
                  {s.points.map((p) => (
                    <li key={p} className="leading-relaxed">
                      <AvecEmail texte={p} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
