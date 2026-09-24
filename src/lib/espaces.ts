import {
  BookOpen,
  HandHelping,
  ScrollText,
  ShieldCheck,
  Wheat,
  type LucideIcon,
} from "lucide-react"

import type { Enums } from "@/lib/database.types"

export type TypeIntervenant = Enums<"type_intervenant">

export type Espace = {
  slug: string
  nom: string
  /** « demandeur » : ceux qui ont un besoin ; « intervenant » : ceux qui viennent aider */
  role: "demandeur" | "intervenant"
  icon: LucideIcon
  intervenants: string
  description: string
  exemples: string[]
  /** Types d'intervenants possibles dans cet espace */
  types: { valeur: TypeIntervenant; label: string }[]
}

/**
 * Les 5 espaces. Les 4 espaces d'intervenants ont les mêmes « slug » que
 * dans la base Supabase ; l'espace « demandeurs » regroupe les personnes
 * qui ont besoin de quelque chose.
 */
export const ESPACES: Espace[] = [
  {
    slug: "demandeurs",
    nom: "Demandeurs",
    role: "demandeur",
    icon: HandHelping,
    intervenants: "Pour vous qui avez un besoin",
    description:
      "Téfilines, mezouza, 'hallot, bar-mitsva, cacheroute… Faites une demande : l'intervenant le plus proche vient vous aider.",
    exemples: ["Faire une demande", "Suivi en direct", "Gratuit"],
    types: [],
  },
  {
    slug: "bahourim",
    nom: "Bahourim",
    role: "intervenant",
    icon: ScrollText,
    intervenants: "Les bahourim",
    description:
      "Téfilines, mezouza, boîte de tsédaka, livres : le bahour le plus proche vient chez vous.",
    exemples: ["Téfilines", "Mezouza", "Boîte de tsédaka", "Sefer / siddour"],
    types: [{ valeur: "bahour", label: "Bahour" }],
  },
  {
    slug: "equipe-feminine",
    nom: "Équipe féminine",
    role: "intervenant",
    icon: Wheat,
    intervenants: "Les femmes de l'équipe",
    description:
      "'Hallot, bougies et horaires de Chabbat, cours, préparation de Chabbat : une femme de l'équipe vient vous aider.",
    exemples: ["'Hallot", "Bougies & horaires", "Cours de Torah", "Préparer Chabbat"],
    types: [{ valeur: "femme", label: "Femme de l'équipe" }],
  },
  {
    slug: "sofer-rav-rabbanit",
    nom: "Sofer / Rav / Rabbanit",
    role: "intervenant",
    icon: ShieldCheck,
    intervenants: "Sofer, rav, rabbanit",
    description:
      "Cacheroute, bérakhot, aide dans une situation délicate, questions, accompagnement et mariages.",
    exemples: ["Cacheroute", "Bérakhot", "Accompagnement", "Mariage"],
    types: [
      { valeur: "sofer", label: "Sofer" },
      { valeur: "rav", label: "Rav" },
      { valeur: "rabbanit", label: "Rabbanit" },
    ],
  },
  {
    slug: "chaliah",
    nom: "Chaliah",
    role: "intervenant",
    icon: BookOpen,
    intervenants: "Les chlou'him",
    description:
      "Éducation juive, bar-mitsva, paracha et visites aux personnes dans le besoin, sans jamais imposer.",
    exemples: ["Éducation juive", "Bar-mitsva", "Paracha", "Visites"],
    types: [{ valeur: "chaliah", label: "Chaliah" }],
  },
]

/** Les 4 espaces où l'on peut demander un service. */
export const ESPACES_SERVICES = ESPACES.filter((e) => e.role === "intervenant")

export function trouverEspace(slug: string | undefined | null) {
  return ESPACES.find((e) => e.slug === slug)
}

export function libelleType(type: TypeIntervenant | null | undefined) {
  for (const e of ESPACES) {
    const t = e.types.find((x) => x.valeur === type)
    if (t) return t.label
  }
  return "Intervenant"
}
