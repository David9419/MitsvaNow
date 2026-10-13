import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Mail, MessageCircle, Phone, ShieldAlert, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { LIEN_INSTAGRAM } from "@/components/bouton-instagram"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import {
  EMAIL_CONTACT,
  INSTAGRAM_COMPTE,
  TELEPHONE_AFFICHE,
  TELEPHONE_CONTACT,
  WHATSAPP_CONTACT,
} from "@/lib/contact"
import { obtenirDico } from "@/lib/i18n/serveur"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.contact }
}

/** Logo Instagram (dessin simple, aux couleurs d'Instagram). */
function LogoInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Carte({
  icone: Icone,
  fond,
  titre,
  valeur,
  texte,
  children,
  delai,
}: {
  icone: LucideIcon | typeof LogoInstagram
  fond: string
  titre: string
  valeur: string
  texte: string
  children: ReactNode
  delai: number
}) {
  return (
    <section
      className="group flex animate-in fade-in slide-in-from-bottom-4 flex-col rounded-3xl border bg-card p-6 shadow-sm transition-all duration-500 fill-mode-both hover:-translate-y-1 hover:shadow-xl"
      style={{ animationDelay: `${delai}ms` }}
    >
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6",
          fond
        )}
      >
        <Icone className="size-7" />
      </span>
      <h2 className="mt-5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{titre}</h2>
      <p className="mt-1 text-xl font-bold break-all" dir="ltr">
        {valeur}
      </p>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{texte}</p>
      <div className="mt-5 flex flex-wrap gap-2">{children}</div>
    </section>
  )
}

/** Page Contact : téléphone (appel + WhatsApp), Instagram, e-mail. */
export default async function ContactPage() {
  const t = await obtenirDico()
  const c = t.contact
  return (
    <>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
          {t.legal.retour}
        </Link>

        <header className="mt-6 animate-in fade-in slide-in-from-bottom-2 text-center duration-500">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.titre}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{c.sousTitre}</p>
        </header>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Carte
            icone={Phone}
            fond="bg-gradient-to-br from-success to-success/70"
            titre={c.telephone}
            valeur={TELEPHONE_AFFICHE}
            texte={c.telephoneTexte}
            delai={0}
          >
            <Button asChild className="bg-success text-success-foreground hover:bg-success/90">
              <a href={`tel:${TELEPHONE_CONTACT}`}>
                <Phone /> {c.appeler}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={WHATSAPP_CONTACT} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> {c.whatsapp}
              </a>
            </Button>
          </Carte>
          <Carte
            icone={LogoInstagram}
            fond="bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]"
            titre={c.instagram}
            valeur={INSTAGRAM_COMPTE}
            texte={c.instagramTexte}
            delai={100}
          >
            <Button asChild>
              <a href={LIEN_INSTAGRAM} target="_blank" rel="noopener noreferrer">
                <LogoInstagram className="size-4" /> {c.suivre}
              </a>
            </Button>
          </Carte>
          <Carte
            icone={Mail}
            fond="bg-gradient-to-br from-primary to-primary/70"
            titre={c.email}
            valeur={EMAIL_CONTACT}
            texte={c.emailTexte}
            delai={200}
          >
            <Button asChild>
              <a href={`mailto:${EMAIL_CONTACT}`}>
                <Mail /> {c.ecrire}
              </a>
            </Button>
          </Carte>
        </div>

        <div className="mt-8 flex animate-in fade-in flex-col items-center gap-3 text-center text-sm duration-700 fill-mode-both [animation-delay:300ms]">
          <p className="text-muted-foreground">{c.reponse}</p>
          <p className="flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 font-medium text-destructive">
            <ShieldAlert className="size-4 shrink-0" /> {c.urgence}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
