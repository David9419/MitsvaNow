import { ViewTransition } from "react"

/**
 * Animation de changement de page : l'ancienne page s'efface doucement vers le haut,
 * la nouvelle arrive par le bas avec un léger flou (voir « page-entree » / « page-sortie »
 * dans globals.css). Le modèle (template) est recréé à chaque navigation, ce qui déclenche
 * l'animation ; les navigateurs qui ne savent pas le faire affichent la page normalement.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-entree" exit="page-sortie" default="none">
      {children}
    </ViewTransition>
  )
}
