-- =====================================================================
-- Notifications dans l'application iPhone / Android (Firebase Cloud Messaging)
-- Chaque téléphone qui a l'application enregistre son « jeton » Firebase.
-- La fonction notifier-demande envoie alors la notification à la fois aux
-- navigateurs (web push, abonnements_push) et aux téléphones (appareils_natifs).
-- Un jeton qui n'existe plus est mis « actif = false » (jamais supprimé ici).
-- =====================================================================
create table if not exists public.appareils_natifs (
  jeton text primary key check (length(jeton) between 20 and 4096),
  utilisateur_id uuid not null references public.profiles (id) on delete cascade,
  plateforme text not null check (plateforme in ('android', 'ios')),
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
create index if not exists appareils_natifs_utilisateur_idx on public.appareils_natifs (utilisateur_id) where actif;
alter table public.appareils_natifs enable row level security;
create policy "Voir mes appareils"
  on public.appareils_natifs for select to authenticated
  using (utilisateur_id = (select auth.uid()));

-- Le téléphone enregistre (ou rafraîchit) son jeton
create or replace function public.enregistrer_appareil_natif(p_jeton text, p_plateforme text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Vous devez être connecté.'; end if;
  if p_plateforme not in ('android', 'ios') or p_jeton is null or length(p_jeton) not between 20 and 4096 then
    raise exception 'Appareil invalide.';
  end if;
  insert into public.appareils_natifs (jeton, utilisateur_id, plateforme)
  values (p_jeton, auth.uid(), p_plateforme)
  on conflict (jeton) do update
    set utilisateur_id = excluded.utilisateur_id, plateforme = excluded.plateforme,
        actif = true, maj_le = now();
end;
$$;

-- Couper les notifications sur ce téléphone
create or replace function public.retirer_appareil_natif(p_jeton text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.appareils_natifs set actif = false, maj_le = now()
  where jeton = p_jeton and utilisateur_id = (select auth.uid());
$$;

-- Les jetons actifs d'une personne (pour la fonction d'envoi)
create or replace function public.jetons_de(p_utilisateur uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(json_agg(json_build_object('jeton', jeton, 'plateforme', plateforme)), '[]'::json)
  from public.appareils_natifs where utilisateur_id = p_utilisateur and actif;
$$;

-- Les informations d'une notification comprennent maintenant les jetons des téléphones
create or replace function public.infos_notification(p_demande uuid, p_destinataire uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'demande', d.id,
    'statut', d.statut,
    'service', public.noms_service(s),
    'demandeur', trim(pd.prenom || ' ' || coalesce(pd.nom, '')),
    'intervenant', pi.prenom,
    'adresse', d.adresse,
    'distance_m', case when i.position is not null then round(extensions.st_distance(d.position, i.position)) end,
    'programmee_pour', d.programmee_pour,
    'transport', d.transport,
    'eta_minutes', d.eta_minutes,
    'motif', d.motif_annulation,
    'note', (select a.note from public.avis a where a.demande_id = d.id),
    'langue', coalesce(dest.langue, 'fr'),
    'abonnements', coalesce((
      select json_agg(json_build_object('endpoint', a.endpoint, 'p256dh', a.p256dh, 'auth', a.auth))
      from public.abonnements_push a where a.utilisateur_id = p_destinataire
    ), '[]'::json),
    'jetons', public.jetons_de(p_destinataire)
  )
  from public.demandes d
  join public.services s on s.id = d.service_id
  join public.profiles pd on pd.id = d.demandeur_id
  left join public.profiles pi on pi.id = d.intervenant_id
  left join public.intervenants i on i.id = coalesce(d.intervenant_id, p_destinataire)
  left join public.profiles dest on dest.id = p_destinataire
  where d.id = p_demande;
$$;

grant execute on function public.enregistrer_appareil_natif(text, text) to authenticated;
grant execute on function public.retirer_appareil_natif(text) to authenticated;
