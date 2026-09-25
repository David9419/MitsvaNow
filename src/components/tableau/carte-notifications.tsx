"use client"

import { BellOff, BellRing, CheckCircle2, Share, SquarePlus } from "lucide-react"

import { CarteWidget } from "@/components/tableau/widgets/carte-widget"
import { Button } from "@/components/ui/button"
import type { EtatPush } from "@/lib/tableau/push"

type Props = {
  etat: EtatPush
  onActiver: () => void
  onTester: () => void
}

/** Les 3 étapes pour installer l'application sur iPhone / iPad. */
function EtapesEcranAccueil() {
  return (
    <ol className="flex flex-col gap-2 text-sm">
      <li className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
        Dans Safari, touchez <Share className="inline size-4 text-primary" aria-label="Partager" /> (en bas de l&apos;écran).
      </li>
      <li className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
        Choisissez <SquarePlus className="inline size-4 text-primary" /> « Sur l&apos;écran d&apos;accueil », puis « Ajouter ».
      </li>
      <li className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
        Ouvrez Mivtsa Now depuis la nouvelle icône et activez les notifications.
      </li>
    </ol>
  )
}

const TEXTE_REFUSE =
  "Les notifications sont bloquées pour ce site. Sur iPhone : Réglages → Notifications → Mivtsa Now. Sur Android ou ordinateur : touchez le cadenas à gauche de l'adresse → Notifications → Autoriser."

/** Bandeau bien visible en haut du tableau tant que les notifications ne sont pas prêtes. */
export function BandeauNotifications({ etat, onActiver }: Omit<Props, "onTester">) {
  if (etat === "chargement" || etat === "actif" || etat === "non-supporte") return null

  return (
    <section className="flex animate-in fade-in slide-in-from-top-2 flex-col gap-4 rounded-2xl border border-accent/50 bg-accent/10 p-5 duration-500 sm:flex-row sm:items-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {etat === "refuse" ? <BellOff className="size-6" /> : <BellRing className="size-6 animate-pulse" />}
      </span>
      <div className="flex-1">
        <h2 className="font-heading font-bold">
          {etat === "ecran-accueil"
            ? "Installez Mivtsa Now pour recevoir les demandes"
            : etat === "refuse"
              ? "Les notifications sont bloquées"
              : "Recevez les demandes même site fermé"}
        </h2>
        {etat === "ecran-accueil" ? (
          <div className="mt-2">
            <p className="mb-2 text-sm text-muted-foreground">
              Sur iPhone, Apple n&apos;envoie les notifications qu&apos;aux applications installées sur l&apos;écran d&apos;accueil :
            </p>
            <EtapesEcranAccueil />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {etat === "refuse"
              ? TEXTE_REFUSE
              : "Une notification arrive sur votre téléphone dès qu'une personne proche a besoin de vous, même écran verrouillé."}
          </p>
        )}
      </div>
      {etat === "inactif" && (
        <Button onClick={onActiver} size="lg" className="shrink-0">
          <BellRing /> Activer les notifications
        </Button>
      )}
    </section>
  )
}

/** Carte « Notifications » du tableau de bord (avec le bouton de test). */
export function CarteNotifications({ etat, onActiver, onTester }: Props) {
  return (
    <CarteWidget
      icon={BellRing}
      titre="Notifications"
      sousTitre="Sur ce téléphone, même site fermé"
      delai={480}
      action={
        etat === "actif" ? (
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">Activées</span>
        ) : undefined
      }
    >
      {etat === "chargement" ? (
        <p className="text-sm text-muted-foreground">Vérification…</p>
      ) : etat === "actif" ? (
        <div className="flex flex-1 flex-col gap-4">
          <p className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            Cet appareil reçoit les nouvelles demandes, même quand le site est fermé ou l&apos;écran verrouillé.
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <Button variant="outline" onClick={onTester}>
              Envoyer une notification de test
            </Button>
            <p className="text-xs text-muted-foreground">
              Elle arrive au bout de 5 secondes : fermez le site ou verrouillez le téléphone pour essayer.
            </p>
          </div>
        </div>
      ) : etat === "ecran-accueil" ? (
        <EtapesEcranAccueil />
      ) : etat === "refuse" ? (
        <p className="text-sm text-muted-foreground">{TEXTE_REFUSE}</p>
      ) : etat === "non-supporte" ? (
        <p className="text-sm text-muted-foreground">
          Ce navigateur ne sait pas recevoir de notifications. Essayez avec Chrome, Safari ou Edge à jour.
        </p>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Activez-les pour être prévenu dès qu&apos;une personne proche a besoin de vous.
          </p>
          <Button className="mt-auto" onClick={onActiver}>
            <BellRing /> Activer les notifications
          </Button>
        </div>
      )}
    </CarteWidget>
  )
}
