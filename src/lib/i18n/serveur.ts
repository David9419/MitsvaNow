import "server-only"

import { cookies } from "next/headers"

import { DICTIONNAIRES } from "@/lib/i18n"
import { COOKIE_LANGUE, LANGUE_PAR_DEFAUT, estLangue, type Langue } from "@/lib/i18n/langues"

/** Langue choisie par la personne (cookie), français par défaut. */
export async function obtenirLangue(): Promise<Langue> {
  const valeur = (await cookies()).get(COOKIE_LANGUE)?.value
  return estLangue(valeur) ? valeur : LANGUE_PAR_DEFAUT
}

/** Les textes dans la langue de la personne. */
export async function obtenirDico() {
  return DICTIONNAIRES[await obtenirLangue()]
}
