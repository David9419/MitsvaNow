import type { Metadata } from "next"

import { PageLegale } from "@/components/page-legale"
import { obtenirDico } from "@/lib/i18n/serveur"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenirDico()).meta.confidentialite }
}

export default function Page() {
  return <PageLegale doc="confidentialite" />
}
