import { SignalPresence } from "@/components/signal-presence"

/** Toutes les pages de l'espace connecté signalent la présence de la personne. */
export default function AccueilLayout({ children }: LayoutProps<"/accueil">) {
  return (
    <>
      <SignalPresence />
      {children}
    </>
  )
}
