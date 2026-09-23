import { BookOpen, ScrollText, ShieldCheck, Wheat, type LucideIcon } from "lucide-react"

import type { Enums } from "@/lib/database.types"

export type TypeIntervenant = Enums<"type_intervenant">

export type Espace = {
  slug: string
  nom: string
  icon: LucideIcon
  intervenants: string
  description: string
  exemples: string[]
  /** Types d'intervenants possibles dans cet espace */
  types: { valeur: TypeIntervenant; label: string }[]
}

/** Les 4 espaces (mêmes « slug » que dans la base Supabase). */
export const ESPACES: Espace[] = [
  {
    slug: "bahourim",
    nom: "Bahourim",
    icon: ScrollText,
    intervenants: "Les bahourim",
    description:
      "Envie de mettre les téfilines ? Le bahour le plus proche vient vous les mettre.",
    exemples: ["Téfilines", "Loulav & étrog", "Chofar"],
    types: [{ valeur: "bahour", label: "Bahour" }],
  },
  {
    slug: "equipe-feminine",
    nom: "Équipe féminine",
    icon: Wheat,
    intervenants: "Les femmes de l'équipe",
    description:
      "Besoin de 'hallot pour Chabbat ? Une femme de l'équipe vient les faire avec vous ou vous les apporte.",
    exemples: ["'Hallot", "Bougies de Chabbat", "Accompagnement"],
    types: [{ valeur: "femme", label: "Femme de l'équipe" }],
  },
  {
    slug: "sofer-rav-rabbanit",
    nom: "Sofer / Rav / Rabbanit",
    icon: ShieldCheck,
    intervenants: "Sofer, rav, rabbanit",
    description:
      "Cachériser un four, vérifier des téfilines ou poser une question de halakha.",
    exemples: ["Cachérisation", "Vérification", "Halakha"],
    types: [
      { valeur: "sofer", label: "Sofer" },
      { valeur: "rav", label: "Rav" },
      { valeur: "rabbanit", label: "Rabbanit" },
    ],
  },
  {
    slug: "chaliah",
    nom: "Chaliah",
    icon: BookOpen,
    intervenants: "Les chlou'him",
    description:
      "Éduquer sans imposer : des cours, un accompagnement et une orientation progressive vers la Torah.",
    exemples: ["Cours", "Accompagnement", "Orientation"],
    types: [{ valeur: "chaliah", label: "Chaliah" }],
  },
]

export function trouverEspace(slug: string | undefined | null) {
  return ESPACES.find((e) => e.slug === slug)
}
