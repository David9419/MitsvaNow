"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Check, Hourglass, Loader2, LogOut, Phone, RefreshCw, Settings, ShieldAlert, ShieldCheck } from "lucide-react"

import { deconnexion } from "@/app/(auth)/actions"
import { useT } from "@/components/i18n/langue-provider"
import { Button } from "@/components/ui/button"
import type { StatutCompte } from "@/lib/tableau/charger"
import { cn } from "@/lib/utils"

/**
 * Page affichée tant que le compte n'est pas validé par un administrateur
 * (ou s'il a été refusé / suspendu). Rien de privé n'est chargé ici.
 */
export function CompteEnVerification({ prenom, compte }: { prenom: string; compte: StatutCompte }) {
  const t = useT()
  const v = t.verification
  const router = useRouter()
  const [enCours, lancer] = useTransition()
  const bloque = compte.verification === "refuse" || compte.verification === "suspendu"

  const actualiser = () => lancer(() => router.refresh())

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-10">
      <section className="relative animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-3xl border bg-card p-6 shadow-xl duration-700 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span
            className={cn(
              "relative flex size-20 items-center justify-center rounded-full",
              bloque ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            )}
          >
            {!bloque && <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />}
            {bloque ? <ShieldAlert className="size-9" /> : <ShieldCheck className="size-9" />}
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
            {bloque ? (compte.verification === "refuse" ? v.titreRefuse : v.titreSuspendu) : v.titreAttente}
          </h1>
          {prenom && !bloque && <p className="mt-1 font-semibold text-primary">{prenom}</p>}
          <p className="mt-3 max-w-md text-muted-foreground">{bloque ? v.texteBloque : v.texteAttente}</p>
        </div>

        {bloque ? (
          compte.motif && (
            <p className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <span className="font-semibold">{v.motif} : </span>
              {compte.motif}
            </p>
          )
        ) : (
          <>
            {/* Les 3 étapes : la 2e est en cours */}
            <ol className="mt-8 grid gap-3 sm:grid-cols-3">
              {v.etapes.map((etape, i) => (
                <li
                  key={etape}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-sm font-medium sm:flex-col sm:text-center",
                    i === 0 && "border-success/40 bg-success/5",
                    i === 1 && "border-primary/40 bg-primary/5 shadow-md shadow-primary/10",
                    i === 2 && "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      i === 0 && "bg-success text-success-foreground",
                      i === 1 && "bg-primary text-primary-foreground",
                      i === 2 && "bg-muted"
                    )}
                  >
                    {i === 0 ? <Check className="size-4" /> : i === 1 ? <Hourglass className="size-4 animate-pulse" /> : 3}
                  </span>
                  {etape}
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
              {compte.telephone && (
                <p className="flex items-start gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span dir="auto">{v.appel(compte.telephone)}</span>
                </p>
              )}
              <p>{v.delai}</p>
              <p>{v.pendant}</p>
            </div>
          </>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {!bloque && (
            <Button onClick={actualiser} disabled={enCours}>
              {enCours ? <Loader2 className="animate-spin" /> : <RefreshCw />} {v.actualiser}
            </Button>
          )}
          {bloque && (
            <Button asChild>
              <Link href="/contact">{v.contacter}</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/accueil/parametres">
              <Settings /> {v.parametres}
            </Link>
          </Button>
          <form action={deconnexion}>
            <Button type="submit" variant="ghost">
              <LogOut className="rtl:-scale-x-100" /> {v.deconnexion}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
