import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HandHeart,
  Hourglass,
  LogIn,
  PlayCircle,
  Send,
  UserPlus,
} from "lucide-react"

import { ApercuEtapes } from "@/components/landing/apercu-etapes"
import { BandeauServices } from "@/components/landing/bandeau-services"
import { Faq } from "@/components/landing/faq"
import { Radar } from "@/components/landing/radar"
import { Reveal } from "@/components/landing/reveal"
import { TexteFlou } from "@/components/landing/texte-flou"
import { SiteFooter } from "@/components/site-footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ESPACES } from "@/lib/espaces"

const statuts = [
  { icon: Hourglass, nom: "En attente", texte: "On cherche l'intervenant" },
  { icon: CheckCircle2, nom: "Acceptée", texte: "Un intervenant a dit oui" },
  { icon: PlayCircle, nom: "En cours", texte: "Il est en route ou sur place" },
  { icon: Clock, nom: "Terminée", texte: "Mission accomplie !" },
]

export default function Home() {
  return (
    <main className="flex-1 overflow-x-clip">
      {/* ---------- Accueil ---------- */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 size-96 animate-blob rounded-full bg-primary/20 blur-3xl" />
          <div
            className="absolute top-40 -right-24 size-96 animate-blob rounded-full bg-accent/25 blur-3xl"
            style={{ animationDelay: "-5s" }}
          />
          <div
            className="absolute bottom-0 left-1/3 size-72 animate-blob rounded-full bg-success/10 blur-3xl"
            style={{ animationDelay: "-9s" }}
          />
        </div>

        <div className="entree-flou mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col items-start gap-6">
            <Badge
              variant="outline"
              className="animate-in fade-in slide-in-from-bottom-2 gap-2 bg-card px-3 py-1 text-sm duration-700"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Des intervenants près de chez vous
            </Badge>

            <h1 className="text-4xl leading-tight font-bold tracking-tight md:text-6xl">
              <TexteFlou texte="Une mitsva ?" delai={200} pas={120} />
              <br />
              <TexteFlou
                texte="Quelqu'un arrive."
                delai={450}
                pas={140}
                classeMot="bg-gradient-to-r from-primary via-primary/55 to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
              />
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-4 max-w-lg text-lg text-muted-foreground delay-200 duration-700 fill-mode-both">
              Mettre les téfilines, installer une mezouza, préparer les
              &apos;hallot, préparer une bar-mitsva… Faites une demande et{" "}
              <strong className="text-foreground">
                Mivtsa Now trouve l&apos;intervenant disponible le plus proche
              </strong>{" "}
              pour venir vous aider.
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-wrap gap-3 delay-300 duration-700 fill-mode-both">
              <Button asChild size="lg" className="group shadow-lg shadow-primary/25">
                <Link href="/inscription?espace=demandeurs">
                  Faire une demande
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/inscription?role=intervenant">Devenir intervenant</Link>
              </Button>
            </div>

            <p className="animate-in fade-in text-sm text-muted-foreground delay-500 duration-700 fill-mode-both">
              Déjà inscrit ?{" "}
              <Link href="/connexion" className="font-medium text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </div>

          <div className="animate-in fade-in zoom-in-90 px-4 delay-200 duration-1000 fill-mode-both">
            <Radar />
          </div>
        </div>
      </section>

      {/* ---------- Bandeau des services qui défile ---------- */}
      <BandeauServices />

      {/* ---------- Comment ça marche ---------- */}
      <section id="comment" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Comment ça marche
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              <TexteFlou texte="4 étapes, quelques minutes" />
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pas besoin de connaître quelqu&apos;un : la plateforme s&apos;occupe
              de trouver la bonne personne, au bon endroit.
            </p>
          </Reveal>
          <Reveal>
            <ApercuEtapes />
          </Reveal>
        </div>
      </section>

      {/* ---------- Les 4 espaces ---------- */}
      <section id="espaces" className="scroll-mt-20 bg-secondary/50 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4 bg-card">
              Les 5 espaces
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              <TexteFlou texte="Le bon intervenant pour chaque besoin" />
            </h2>
            <p className="mt-4 text-muted-foreground">
              Un espace pour ceux qui ont un besoin, quatre espaces pour ceux
              qui viennent aider. Choisissez le vôtre.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            {ESPACES.map((e, i) => (
              <Reveal
                key={e.slug}
                delay={(i % 2) * 150}
                className={e.role === "demandeur" ? "md:col-span-2" : undefined}
              >
                <Card
                  className={
                    e.role === "demandeur"
                      ? "group relative h-full overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 ring-1 ring-primary/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20"
                      : "group relative h-full overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/15"
                  }
                >
                  {e.role === "demandeur" && (
                    <Badge className="absolute top-5 right-5 z-10 bg-accent text-accent-foreground">
                      Vous avez un besoin ?
                    </Badge>
                  )}
                  <div
                    aria-hidden
                    className="absolute -top-16 -right-16 size-40 rounded-full bg-primary/5 transition-transform duration-700 group-hover:scale-[3]"
                  />
                  <CardHeader className="relative">
                    <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                      <e.icon className="size-7" />
                    </div>
                    <CardTitle className="font-heading text-xl">{e.nom}</CardTitle>
                    <CardDescription className="font-medium text-primary">
                      {e.intervenants}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative flex flex-col gap-4">
                    <p className="text-muted-foreground">{e.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {e.exemples.map((x) => (
                        <Badge key={x} variant="secondary">
                          {x}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="relative mt-auto flex flex-wrap gap-3">
                    <Button asChild className="group/btn">
                      <Link href={`/inscription?espace=${e.slug}`}>
                        <UserPlus />
                        {e.role === "demandeur" ? "Faire une demande" : "Créer un compte"}
                        <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/connexion?espace=${e.slug}`}>
                        <LogIn />
                        Se connecter
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Suivi ---------- */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Suivi en direct
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              <TexteFlou texte="Vous savez toujours où en est votre demande" />
            </h2>
          </Reveal>

          <div className="relative grid gap-10 md:grid-cols-4">
            <Reveal className="absolute top-7 right-[12.5%] left-[12.5%] hidden md:block">
              <div className="ligne-progression h-1 rounded-full bg-gradient-to-r from-primary via-accent to-success" />
            </Reveal>
            {statuts.map((s, i) => (
              <Reveal key={s.nom} delay={300 + i * 250} className="relative text-center">
                <div
                  className={
                    i === statuts.length - 1
                      ? "relative mx-auto flex size-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg shadow-success/30 transition-transform hover:scale-110"
                      : "relative mx-auto flex size-14 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-md transition-transform hover:scale-110"
                  }
                >
                  {i === 0 && (
                    <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary" />
                  )}
                  <s.icon className="size-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{s.nom}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.texte}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="scroll-mt-20 bg-secondary/50 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-[1fr_1.5fr]">
          <Reveal>
            <Badge variant="secondary" className="mb-4 bg-card">
              Questions fréquentes
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              <TexteFlou texte="Vous vous posez des questions ?" />
            </h2>
            <p className="mt-4 text-muted-foreground">
              Voici les réponses aux questions qu&apos;on nous pose le plus
              souvent.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <Card className="px-6 py-2">
              <Faq />
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ---------- Devenir intervenant ---------- */}
      <section id="rejoindre" className="scroll-mt-20 px-4 py-24">
        <Reveal className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/30 md:px-16">
            <div
              aria-hidden
              className="absolute -top-20 -left-20 size-72 animate-blob rounded-full bg-accent/30 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -right-20 -bottom-20 size-72 animate-blob rounded-full bg-primary-foreground/15 blur-3xl"
              style={{ animationDelay: "-7s" }}
            />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
              <HandHeart className="size-12 animate-float" />
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                <TexteFlou texte="Vous voulez aider ?" />
              </h2>
              <p className="text-lg opacity-90">
                Bahour, femme de l&apos;équipe, sofer, rav, rabbanit ou
                chaliah : inscrivez-vous comme intervenant et recevez les
                demandes des personnes proches de vous.
              </p>
              <Button
                asChild
                size="lg"
                className="group bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
              >
                <Link href="/inscription?role=intervenant">
                  Devenir intervenant
                  <Send className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  )
}
