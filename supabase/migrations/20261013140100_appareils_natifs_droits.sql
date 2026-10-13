-- Appareils natifs : droits stricts
revoke execute on function public.enregistrer_appareil_natif(text, text) from public, anon;
revoke execute on function public.retirer_appareil_natif(text) from public, anon;
revoke execute on function public.jetons_de(uuid) from public, anon, authenticated;
revoke all on table public.appareils_natifs from anon;
revoke insert, update, delete, truncate, references, trigger on table public.appareils_natifs from authenticated;
