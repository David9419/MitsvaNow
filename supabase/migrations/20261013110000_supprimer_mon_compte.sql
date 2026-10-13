-- =====================================================================
-- « Supprimer mon compte » (obligatoire pour l'App Store et Google Play)
--
-- La personne supprime elle-même son compte depuis les Paramètres.
-- Ses interventions en cours repartent chez les autres intervenants,
-- ses demandes ouvertes sont annulées, puis le compte est effacé :
-- toutes ses données suivent (profil, fiche intervenant, demandes, avis reçus
-- sur ses demandes, appareils de notification…) grâce aux liens « on delete cascade ».
-- Les photos (Storage) sont effacées par le site juste avant, avec l'API Storage.
-- =====================================================================
create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_d record;
begin
  if v_uid is null then
    raise exception 'Vous devez être connecté.';
  end if;
  if exists (select 1 from public.profiles where id = v_uid and est_admin) then
    raise exception 'Un administrateur ne peut pas supprimer son compte.';
  end if;

  -- Il ne reçoit plus rien
  update public.intervenants set disponible = false where id = v_uid;
  update public.demande_propositions set active = false where intervenant_id = v_uid and active;

  -- Ses interventions en cours repartent chez les autres (le demandeur est prévenu)
  for v_d in
    select id from public.demandes
    where intervenant_id = v_uid and statut in ('acceptee', 'en_cours')
  loop
    update public.demandes
    set statut = 'en_attente', intervenant_id = null, transport = null, eta_minutes = null,
        acceptee_le = null, confirmee = false, recherche_depuis = now(),
        annulee_par = 'intervenant', motif_annulation = 'L''intervenant n''est plus disponible.'
    where id = v_d.id;
    perform public.attribuer_demande(v_d.id);
  end loop;

  -- Ses propres demandes ouvertes sont annulées
  update public.demandes
  set statut = 'annulee', annulee_par = 'demandeur', motif_annulation = null
  where demandeur_id = v_uid and statut in ('en_attente', 'acceptee', 'en_cours');

  -- Effacement du compte (et, en cascade, de toutes ses données)
  delete from auth.users where id = v_uid;
end;
$$;
revoke execute on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
