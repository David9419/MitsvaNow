import { Bike, Bus, Car, Footprints, Scooter, type LucideIcon } from "lucide-react"

import type { Transport } from "@/lib/tableau/types"

/** Icône de chaque moyen de transport. */
export const ICONES_TRANSPORT: Record<Transport, LucideIcon> = {
  a_pied: Footprints,
  trottinette: Scooter,
  velo: Bike,
  voiture: Car,
  transports: Bus,
}
