-- Droits stricts : un visiteur non connecté (anon) ne peut appeler aucune fonction privée
-- ni toucher aux tables internes (RLS les protégeait déjà, ceci ferme la porte en plus).
revoke execute on function public.admin_comptes() from public, anon;
revoke execute on function public.admin_decider(uuid, text, text) from public, anon;
revoke execute on function public.compte_valide() from public, anon;
revoke execute on function public.mon_statut_compte() from public, anon;
revoke execute on function public.email_inscrit(text) from public, anon, authenticated;
revoke all on table public.demande_propositions from anon;
revoke insert, update, delete, truncate, references, trigger on table public.demande_propositions from authenticated;
revoke all on table public.abonnements_push from anon;
revoke insert, update, truncate, references, trigger on table public.abonnements_push from authenticated;
revoke all on table public.journal_verifications from anon;
revoke insert, update, delete, truncate, references, trigger on table public.journal_verifications from authenticated;
