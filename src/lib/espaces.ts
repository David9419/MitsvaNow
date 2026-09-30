import {
  BookOpen,
  HandHelping,
  ScrollText,
  ShieldCheck,
  Wheat,
  type LucideIcon,
} from "lucide-react"

import type { Enums } from "@/lib/database.types"
import type { Dico } from "@/lib/i18n"

export type TypeIntervenant = Enums<"type_intervenant">

/** Slug d'un espace (= clé de ses textes dans les dictionnaires). */
export type SlugEspace = keyof Dico["espaces"]

export type Espace = {
  slug: SlugEspace
  /** « demandeur » : ceux qui ont un besoin ; « intervenant » : ceux qui viennent aider */
  role: "demandeur" | "intervenant"
  icon: LucideIcon
  /** Types d'intervenants possibles dans cet espace */
  types: TypeIntervenant[]
}

/**
 * Les 5 espaces. Les 4 espaces d'intervenants ont les mêmes « slug » que
 * dans la base Supabase ; l'espace « demandeurs » regroupe les personnes
 * qui ont besoin de quelque chose. Les textes (nom, description…) sont
 * dans les dictionnaires : t.espaces[slug].
 */
export const ESPACES: Espace[] = [
  { slug: "demandeurs", role: "demandeur", icon: HandHelping, types: [] },
  { slug: "bahourim", role: "intervenant", icon: ScrollText, types: ["bahour"] },
  { slug: "equipe-feminine", role: "intervenant", icon: Wheat, types: ["femme"] },
  { slug: "sofer-rav-rabbanit", role: "intervenant", icon: ShieldCheck, types: ["sofer", "rav", "rabbanit"] },
  { slug: "chaliah", role: "intervenant", icon: BookOpen, types: ["chaliah"] },
]

/** Les 4 espaces où l'on peut demander un service. */
export const ESPACES_SERVICES = ESPACES.filter((e) => e.role === "intervenant")

export function trouverEspace(slug: string | undefined | null) {
  return ESPACES.find((e) => e.slug === slug)
}

export function libelleType(type: TypeIntervenant | null | undefined, t: Dico) {
  return type ? t.types[type] : t.types.defaut
}
