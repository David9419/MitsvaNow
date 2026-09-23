import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  HandHeart,
  Hourglass,
  MapPin,
  PlayCircle,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wheat,
} from "lucide-react"

import { Radar } from "@/components/landing/radar"
import { Reveal } from "@/components/landing/reveal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const etapes = [
  {
    icon: Sparkles,
    titre: "Choisissez un espace",
    texte: "Bahourim, équipe féminine, sofer / rav / rabbanit ou chaliah.",
  },
  {
    icon: MapPin,
    titre: "Partagez votre position",
    texte: "Autorisez la localisation ou saisissez simplement votre adresse.",
  },
  {
    icon: Users,
    titre: "On trouve le plus proche",
    texte: "La plateforme contacte l'intervenant disponible le plus près de vous.",
  },
  {
    icon: HandHeart,
    titre: "Il vient vous aider",
    texte: "L'intervenant accepte et se déplace. Vous suivez tout en direct.",
  },
]

const espaces = [
  {
    icon: ScrollText,
    nom: "Bahourim",
    intervenants: "Les bahourim",
    description:
      "Envie de mettre les téfilines ? Le bahour le plus proche vient vous les mettre.",
    exemples: ["Téfilines", "Loulav & étrog", "Chofar"],
  },
  {
    icon: Wheat,
    nom: "Équipe féminine",
    intervenants: "Les femmes de l'équipe",
    description:
      "Besoin de 'hallot pour Chabbat ? Une femme de l'équipe vient les faire avec vous ou vous les apporte.",
    exemples: ["'Hallot", "Bougies de Chabbat", "Accompagnement"],
  },
  {
    icon: ShieldCheck,
    nom: "Sofer / Rav / Rabbanit",
    intervenants: "Sofer, rav, rabbanit",
    description:
      "Cachériser un four, vérifier des téfilines ou poser une question de halakha.",
    exemples: ["Cachérisation", "Vérification", "Halakha"],
  },
  {
    icon: BookOpen,
    nom: "Chaliah",
    intervenants: "Les chlou'him",
    description:
      "Éduquer sans imposer : des cours, un accompagnement et une orientation progressive vers la Torah.",
    exemples: ["Cours", "Accompagnement", "Orientation"],
  },
]

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
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
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

            <h1 className="animate-in fade-in slide-in-from-bottom-4 text-4xl leading-tight font-bold tracking-tight delay-100 duration-700 fill-mode-both md:text-6xl">
              Une mitsva ?<br />
              <span className="text-primary">Quelqu&apos;un arrive.</span>
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-4 max-w-lg text-lg text-muted-foreground delay-200 duration-700 fill-mode-both">
              Mettre les téfilines, préparer les &apos;hallot, cachériser un
              four, suivre un cours… Faites une demande et{" "}
              <strong className="text-foreground">
                Mivtsa Now trouve l&apos;intervenant disponible le plus proche
              </strong>{" "}
              pour venir vous aider.
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-wrap gap-3 delay-300 duration-700 fill-mode-both">
              <Button asChild size="lg" className="group">
                <Link href="#espaces">
                  Faire une demande
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#rejoindre">Devenir intervenant</Link>
              </Button>
            </div>
          </div>

          <div className="animate-in fade-in zoom-in-95 delay-200 duration-1000 fill-mode-both">
            <Radar />
          </div>
        </div>
      </section>

      {/* ---------- Comment ça marche ---------- */}
      <section id="comment" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Comment ça marche
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              4 étapes, quelques minutes
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pas besoin de connaître quelqu&apos;un : la plateforme s&apos;occupe
              de trouver la bonne personne, au bon endroit.
            </p>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {etapes.map((e, i) => (
              <Reveal key={e.titre} delay={i * 120}>
                <Card className="group relative h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <e.icon className="size-6" />
                      </div>
                      <span className="font-heading text-4xl font-bold text-muted">
                        {i + 1}
                      </span>
                    </div>
                    <CardTitle className="font-heading text-base">
                      {e.titre}
                    </CardTitle>
                    <CardDescription>{e.texte}</CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Les 4 espaces ---------- */}
      <section id="espaces" className="scroll-mt-20 bg-secondary/50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4 bg-card">
              Les 4 espaces
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Le bon intervenant pour chaque besoin
            </h2>
            <p className="mt-4 text-muted-foreground">
              Chaque espace a ses intervenants et ses services. D&apos;autres
              services viendront s&apos;ajouter.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            {espaces.map((e, i) => (
              <Reveal key={e.nom} delay={(i % 2) * 120}>
                <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                  <div
                    aria-hidden
                    className="absolute -top-16 -right-16 size-40 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150"
                  />
                  <CardHeader className="relative">
                    <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
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
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Suivi ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Suivi en direct
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Vous savez toujours où en est votre demande
            </h2>
          </Reveal>

          <div className="relative grid gap-8 md:grid-cols-4">
            <div
              aria-hidden
              className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-0.5 bg-gradient-to-r from-primary via-accent to-success md:block"
            />
            {statuts.map((s, i) => (
              <Reveal key={s.nom} delay={i * 150} className="relative text-center">
                <div
                  className={
                    i === statuts.length - 1
                      ? "relative mx-auto flex size-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg"
                      : "relative mx-auto flex size-14 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-md"
                  }
                >
                  <s.icon className="size-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{s.nom}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.texte}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Devenir intervenant ---------- */}
      <section id="rejoindre" className="scroll-mt-20 px-4 pb-20">
        <Reveal className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground md:px-16">
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
                Vous voulez aider ?
              </h2>
              <p className="text-lg opacity-90">
                Bahour, femme de l&apos;équipe, sofer, rav, rabbanit ou
                chaliah : inscrivez-vous comme intervenant et recevez les
                demandes des personnes proches de vous.
              </p>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Devenir intervenant
                <Send />
              </Button>
              <p className="text-sm opacity-75">Les inscriptions ouvrent bientôt.</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- Pied de page ---------- */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <p className="font-heading font-bold">
            <span className="text-foreground">Mivtsa</span>{" "}
            <span className="text-primary">Now</span>
          </p>
          <p>© {new Date().getFullYear()} Mivtsa Now — Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  )
}
