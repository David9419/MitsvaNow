/**
 * Heure du coucher du soleil pour une date et un lieu (algorithme simplifié
 * de l'observatoire naval américain, précis à ~1-2 minutes).
 * Renvoie null si le soleil ne se couche pas (régions polaires).
 */
export function coucherDuSoleil(date: Date, lat: number, lng: number): Date | null {
  const rad = Math.PI / 180
  const minuitUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const jourDeLAnnee = Math.floor((minuitUTC - Date.UTC(date.getFullYear(), 0, 1)) / 86400000) + 1
  const lngHeure = lng / 15
  const t = jourDeLAnnee + (18 - lngHeure) / 24
  const M = 0.9856 * t - 3.289
  let L = M + 1.916 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 282.634
  L = ((L % 360) + 360) % 360
  let RA = Math.atan(0.91764 * Math.tan(L * rad)) / rad
  RA = ((RA % 360) + 360) % 360
  RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15
  const sinDec = 0.39782 * Math.sin(L * rad)
  const cosDec = Math.cos(Math.asin(sinDec))
  const cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad))
  if (cosH < -1 || cosH > 1) return null
  const H = Math.acos(cosH) / rad / 15
  const T = H + RA - 0.06571 * t - 6.622
  const UT = (((T - lngHeure) % 24) + 24) % 24
  return new Date(minuitUTC + UT * 3600000)
}

/** Horaires d'un Chabbat : allumage (coucher du vendredi − 18 min) et sortie (coucher du samedi + 42 min). */
function horaires(vendredi: Date, lat: number, lng: number) {
  const coucher = coucherDuSoleil(vendredi, lat, lng)
  const samedi = new Date(vendredi)
  samedi.setDate(samedi.getDate() + 1)
  const coucherSamedi = coucherDuSoleil(samedi, lat, lng)
  if (!coucher || !coucherSamedi) return null
  return {
    allumage: new Date(coucher.getTime() - 18 * 60000),
    sortie: new Date(coucherSamedi.getTime() + 42 * 60000),
  }
}

/**
 * Le Chabbat qui nous concerne : celui en cours, ou le prochain.
 * (Horaires indicatifs : chaque communauté a ses usages.)
 */
export function prochainChabbat(maintenant: Date, lat: number, lng: number) {
  // Dernier vendredi (aujourd'hui si on est vendredi)
  const vendredi = new Date(maintenant)
  vendredi.setHours(12, 0, 0, 0)
  vendredi.setDate(vendredi.getDate() - ((vendredi.getDay() - 5 + 7) % 7))

  const celuiCi = horaires(vendredi, lat, lng)
  if (celuiCi && maintenant < celuiCi.allumage) return { ...celuiCi, enCours: false }
  if (celuiCi && maintenant <= celuiCi.sortie) return { ...celuiCi, enCours: true }

  const suivant = new Date(vendredi)
  suivant.setDate(suivant.getDate() + 7)
  const h = horaires(suivant, lat, lng)
  return h ? { ...h, enCours: false } : null
}
