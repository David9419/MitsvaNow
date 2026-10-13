import { NotificationsApplication } from "@/components/notifications-application"
import { SignalPresence } from "@/components/signal-presence"

/**
 * Toutes les pages de l'espace connecté signalent la présence de la personne
 * et, dans l'application, ouvrent la bonne page quand on touche une notification.
 */
export default function AccueilLayout({ children }: LayoutProps<"/accueil">) {
  return (
    <>
      <SignalPresence />
      <NotificationsApplication />
      {children}
    </>
  )
}
