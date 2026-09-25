-- Notifications pour les demandeurs : prévenus sur leur téléphone quand leur
-- demande est acceptée, quand l'intervenant est en route, et quand c'est terminé.

-- Contenu de la notification envoyée au demandeur selon le statut de sa demande
create or replace function public.preparer_notification_demandeur(p_demande uuid) returns json
language sql security definer set search_path = '' as $$
  select json_build_object(
    'demande', d.id,
    'titre', case d.statut
      when 'acceptee' then 'Demande acceptée ✅'
      when 'en_cours' then 'Intervenant en route 🚗'
      else 'Mitsva accomplie 🎉' end,
    'corps', case d.statut
      when 'acceptee' then coalesce(p.prenom, 'Un intervenant') || ' a accepté votre demande : ' || s.nom
      when 'en_cours' then coalesce(p.prenom, 'L''intervenant') || ' est en route vers vous (' || s.nom || ').'
      else 'Merci d''avoir fait appel à Mivtsa Now ! Donnez votre avis dans l''application.' end,
    'abonnements', coalesce((
      select json_agg(json_build_object('endpoint', a.endpoint, 'p256dh', a.p256dh, 'auth', a.auth))
      from public.abonnements_push a where a.utilisateur_id = d.demandeur_id
    ), '[]'::json)
  )
  from public.demandes d
  join public.services s on s.id = d.service_id
  left join public.profiles p on p.id = d.intervenant_id
  where d.id = p_demande and d.statut in ('acceptee', 'en_cours', 'terminee');
$$;

revoke execute on function public.preparer_notification_demandeur(uuid) from public, anon, authenticated;
grant execute on function public.preparer_notification_demandeur(uuid) to service_role;

-- Le déclencheur envoie maintenant aussi le destinataire (« intervenant » ou « demandeur »)
create or replace function public.envoyer_notification_push() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets where name = 'push_secret_declencheur';
  if v_secret is null then return new; end if;

  perform net.http_post(
    url := 'https://otwsxjchgbwporwldrkw.supabase.co/functions/v1/notifier-demande',
    body := jsonb_build_object('demande', new.id, 'pour', tg_argv[0]),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-secret', v_secret)
  );
  return new;
exception when others then
  -- Une notification ratée ne doit jamais bloquer la demande
  return new;
end $$;

drop trigger if exists demandes_notification_push on public.demandes;

-- Nouvelle demande proposée à un intervenant
create trigger demandes_notification_push
  after insert or update of intervenant_id on public.demandes
  for each row
  when (new.intervenant_id is not null and new.statut = 'en_attente')
  execute function public.envoyer_notification_push('intervenant');

-- Demande acceptée / en route / terminée : on prévient le demandeur
create trigger demandes_notification_demandeur
  after update of statut on public.demandes
  for each row
  when (old.statut is distinct from new.statut and new.statut in ('acceptee', 'en_cours', 'terminee'))
  execute function public.envoyer_notification_push('demandeur');
