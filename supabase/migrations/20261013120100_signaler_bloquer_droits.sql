-- Signaler / bloquer : aucun accès pour les visiteurs non connectés
revoke execute on function public.signaler(uuid, text, text, boolean) from public, anon;
revoke execute on function public.bloquer_personne(uuid) from public, anon;
revoke execute on function public.debloquer_personne(uuid) from public, anon;
revoke execute on function public.mes_blocages() from public, anon;
revoke execute on function public.admin_signalements() from public, anon;
revoke execute on function public.admin_traiter_signalement(uuid, boolean) from public, anon;
revoke all on table public.signalements from anon;
revoke insert, update, delete, truncate, references, trigger on table public.signalements from authenticated;
revoke all on table public.blocages from anon;
revoke insert, update, delete, truncate, references, trigger on table public.blocages from authenticated;
