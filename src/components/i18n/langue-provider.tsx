"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"

import { DICTIONNAIRES, direction, type Dico, type Langue } from "@/lib/i18n"

const Contexte = createContext<Langue>("fr")

/** Donne la langue choisie à tous les éléments de la page. */
export function LangueProvider({ langue, children }: { langue: Langue; children: ReactNode }) {
  // Au changement de langue, la page garde le bon sens de lecture
  useEffect(() => {
    document.documentElement.lang = langue
    document.documentElement.dir = direction(langue)
  }, [langue])
  return <Contexte.Provider value={langue}>{children}</Contexte.Provider>
}

export function useLangue(): Langue {
  return useContext(Contexte)
}

/** Les textes dans la langue choisie. */
export function useT(): Dico {
  return DICTIONNAIRES[useContext(Contexte)]
}
