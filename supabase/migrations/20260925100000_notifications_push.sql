-- Notifications « push » : l'intervenant reçoit la demande sur son téléphone,
-- même quand le site est fermé ou l'écran verrouillé.
--
-- Fonctionnement :
--   1. le téléphone s'abonne (table abonnements_push) ;
--   2. quand une demande est attribuée à un intervenant, un déclencheur appelle
--      la fonction Supabase « notifier-demande » ;
--   3. cette fonction envoie la notification à tous les appareils de l'intervenant.
--
-- Les clés secrètes (clé privée VAPID, secret du déclencheur) sont rangées dans
-- le coffre-fort de Supabase (Vault), jamais dans Git :
--   push_vapid_public, push_vapid_prive, push_secret_declencheur.

create extension if not exists pg_net with schema extensions;

-- ---------- Appareils abonnés ----------
create table public.abonnements_push (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index abonnements_push_utilisateur_idx on public.abonnements_push (utilisateur_id);

alter table public.abonnements_push enable row level security;

create policy "Chacun voit ses appareils" on public.abonnements_push
  for select to authenticated using (utilisateur_id = (select auth.uid()));
create policy "Chacun retire ses appareils" on public.abonnements_push
  for delete to authenticated using (utilisateur_id = (select auth.uid()));

grant select, delete on public.abonnements_push to authenticated;
grant all on public.abonnements_push to service_role;

-- Enregistre (ou rattache à la personne connectée) l'abonnement de cet appareil
create or replace function public.enregistrer_abonnement_push(
  p_endpoint text, p_p256dh text, p_auth text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 then
    raise exception 'Abonnement invalide';
  end if;
  insert into public.abonnements_push (utilisateur_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set utilisateur_id = excluded.utilisateur_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth;
end $$;

create or replace function public.supprimer_abonnement_push(p_endpoint text) returns void
language sql security definer set search_path = '' as $$
  delete from public.abonnements_push
  where endpoint = p_endpoint and utilisateur_id = auth.uid();
$$;

revoke execute on function public.enregistrer_abonnement_push(text, text, text) from public, anon;
revoke execute on function public.supprimer_abonnement_push(text) from public, anon;
grant execute on function public.enregistrer_abonnement_push(text, text, text) to authenticated;
grant execute on function public.supprimer_abonnement_push(text) to authenticated;

-- ---------- Réservé à la fonction « notifier-demande » (service_role) ----------

-- Clés lues dans le coffre-fort
create or replace function public.secrets_push() returns json
language sql security definer set search_path = '' as $$
  select json_object_agg(name, decrypted_secret)
  from vault.decrypted_secrets
  where name in ('push_vapid_public', 'push_vapid_prive', 'push_secret_declencheur');
$$;

-- Contenu de la notification d'une demande en attente + appareils de l'intervenant
create or replace function public.preparer_notification_push(p_demande uuid) returns json
language sql security definer set search_path = '' as $$
  select json_build_object(
    'demande', d.id,
    'titre', 'Nouvelle demande : ' || s.nom,
    'corps', trim(p.prenom || ' ' || coalesce(p.nom, ''))
      || E'\n📍 ' || coalesce(d.adresse, 'Adresse non précisée')
      || case when i.position is not null then
           ' (à ' || case
             when extensions.st_distance(d.position, i.position) < 1000
               then (round(extensions.st_distance(d.position, i.position) / 10) * 10)::int || ' m'
             else replace(round((extensions.st_distance(d.position, i.position) / 1000)::numeric, 1)::text, '.', ',') || ' km'
           end || ')'
         else '' end,
    'abonnements', coalesce((
      select json_agg(json_build_object('endpoint', a.endpoint, 'p256dh', a.p256dh, 'auth', a.auth))
      from public.abonnements_push a where a.utilisateur_id = d.intervenant_id
    ), '[]'::json)
  )
  from public.demandes d
  join public.services s on s.id = d.service_id
  join public.profiles p on p.id = d.demandeur_id
  join public.intervenants i on i.id = d.intervenant_id
  where d.id = p_demande and d.statut = 'en_attente';
$$;

-- Appareils d'une personne (pour la notification de test)
create or replace function public.abonnements_de(p_utilisateur uuid) returns json
language sql security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth)), '[]'::json)
  from public.abonnements_push where utilisateur_id = p_utilisateur;
$$;

revoke execute on function public.secrets_push() from public, anon, authenticated;
revoke execute on function public.preparer_notification_push(uuid) from public, anon, authenticated;
revoke execute on function public.abonnements_de(uuid) from public, anon, authenticated;
grant execute on function public.secrets_push() to service_role;
grant execute on function public.preparer_notification_push(uuid) to service_role;
grant execute on function public.abonnements_de(uuid) to service_role;

-- ---------- Déclencheur : une demande vient d'être attribuée ----------
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
    body := jsonb_build_object('demande', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-secret', v_secret)
  );
  return new;
exception when others then
  -- Une notification ratée ne doit jamais bloquer la demande
  return new;
end $$;

revoke execute on function public.envoyer_notification_push() from public, anon, authenticated;

create trigger demandes_notification_push
  after insert or update of intervenant_id on public.demandes
  for each row
  when (new.intervenant_id is not null and new.statut = 'en_attente')
  execute function public.envoyer_notification_push();
