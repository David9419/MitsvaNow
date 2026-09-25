// Adresse et clé publique du projet Supabase « Mivstaim Now ».
// Ces deux valeurs sont PUBLIQUES (prévues pour le navigateur) : aucun secret ici.
// On les garde en secours, pour que le site marche même si l'hébergeur
// (Vercel) ne transmet pas les variables d'environnement.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://otwsxjchgbwporwldrkw.supabase.co"

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_2YFAELLnh1BHhwBGMY96Kw_MAXYpMqi"
