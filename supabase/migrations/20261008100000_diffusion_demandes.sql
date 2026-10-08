-- =====================================================================
-- Diffusion des demandes à TOUS les intervenants proches
--  - une demande est proposée en même temps à tous les intervenants
--    disponibles de l'espace, qui proposent le service et dont le rayon
--    d'intervention atteint la personne ;
--  - le premier qui accepte la prend : les autres la perdent ;
--  - si l'intervenant annule (ou si le demandeur préfère quelqu'un d'autre),
--    la demande repart chez tous les proches (sauf lui).
-- =====================================================================

-- ---------- À qui la demande est proposée ----------
create table if not exists public.demande_propositions (
  demande_id uuid not null references public.demandes (id) on delete cascade,
  intervenant_id uuid not null references public.intervenants (id) on delete cascade,
  -- false = la demande ne lui est plus proposée (prise par un autre, refusée, annulée…)
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (demande_id, intervenant_id)
);
create index if not exists demande_propositions_intervenant_idx on public.demande_propositions (intervenant_id);

alter table public.demande_propositions enable row level security;
-- Seule la lecture de ses propres propositions est permise (aucune règle d'écriture :
-- seules les fonctions de la base peuvent ajouter ou désactiver des propositions)
create policy "Voir les demandes qui me sont proposées" on public.demande_propositions
  for select to authenticated using (intervenant_id = (select auth.uid()));

-- Fonctions internes : rangées dans « prive », un espace que le site ne peut pas appeler
create schema if not exists prive;

-- ---------- Cet intervenant peut-il recevoir cette demande ? ----------
create or replace function prive.peut_recevoir(p_intervenant uuid, p_demande uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.demandes d
    join public.services s on s.id = d.service_id
    join public.intervenants i on i.id = p_intervenant
    where d.id = p_demande
      and d.statut = 'en_attente'
      and i.espace_id = s.espace_id
      and i.validation = 'valide'
      and i.disponible
      and i.position is not null
      and i.id <> d.demandeur_id
      and extensions.st_dwithin(i.position, d.position, i.rayon_km * 1000)
      and (
        not exists (select 1 from public.intervenant_services x where x.intervenant_id = i.id)
        or exists (
          select 1 from public.intervenant_services x
          where x.intervenant_id = i.id and x.service_id = d.service_id
        )
      )
      and not exists (
        select 1 from public.demande_refus r
        where r.demande_id = d.id and r.intervenant_id = i.id
      )
  );
$$;

-- ---------- Diffusion : la demande est proposée à tous les proches ----------
-- (garde son nom et sa forme « attribuer_demande » : elle est appelée de plusieurs endroits)
create or replace function public.attribuer_demande(p_demande uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_d public.demandes;
begin
  select * into v_d from public.demandes where id = p_demande for update;
  if v_d.id is null or v_d.statut <> 'en_attente' then
    return null;
  end if;

  -- Nouvelle diffusion : chaque intervenant proche la reçoit (et est prévenu)
  update public.demande_propositions set active = false where demande_id = v_d.id and active;
  insert into public.demande_propositions (demande_id, intervenant_id)
  select v_d.id, i.id
  from public.intervenants i
  where prive.peut_recevoir(i.id, v_d.id)
  on conflict (demande_id, intervenant_id) do update set active = true, created_at = now();

  update public.demandes
  set intervenant_id = null, attribuee_le = now()
  where id = v_d.id;
  return null;
end;
$$;

-- Un intervenant devient disponible (ou change de position / de rayon) :
-- il reçoit les demandes en attente qui le concernent, et perd celles qui ne le concernent plus.
create or replace function prive.proposer_a_intervenant(p_intervenant uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.demande_propositions p
  set active = false
  where p.intervenant_id = p_intervenant
    and p.active
    and not prive.peut_recevoir(p_intervenant, p.demande_id);

  insert into public.demande_propositions (demande_id, intervenant_id)
  select d.id, p_intervenant
  from public.demandes d
  where d.statut = 'en_attente'
    and d.intervenant_id is null
    and prive.peut_recevoir(p_intervenant, d.id)
  on conflict (demande_id, intervenant_id) do update set active = true, created_at = now()
    where not public.demande_propositions.active;
end;
$$;

-- ---------- Intervenant : disponibilité, position, rayon ----------
create or replace function public.mettre_a_jour_intervenant(
  p_disponible boolean default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_rayon_km numeric default null,
  p_adresse text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_i public.intervenants;
  v_nouvelle_position boolean := p_lat is not null and p_lng is not null;
begin
  update public.intervenants
  set disponible = coalesce(p_disponible, disponible),
      position = case when v_nouvelle_position then public.point_gps(p_lat, p_lng) else position end,
      adresse = case when v_nouvelle_position then left(p_adresse, 300) else adresse end,
      rayon_km = case when p_rayon_km between 1 and 200 then p_rayon_km else rayon_km end
  where id = auth.uid()
  returning * into v_i;

  if v_i.id is null then
    raise exception 'Vous n''êtes pas intervenant.';
  end if;

  if v_nouvelle_position then
    update public.profiles
    set position = public.point_gps(p_lat, p_lng), adresse = left(p_adresse, 300)
    where id = v_i.id;
  end if;

  -- En pause : plus aucune proposition ; disponible : les demandes proches arrivent
  if not v_i.disponible then
    update public.demande_propositions set active = false where intervenant_id = v_i.id and active;
  else
    perform prive.proposer_a_intervenant(v_i.id);
  end if;
end;
$$;

-- ---------- Intervenant : accepter (le premier) ou « pas disponible » ----------
create or replace function public.repondre_demande(
  p_demande uuid,
  p_accepter boolean,
  p_transport text default null,
  p_eta_minutes integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_d public.demandes;
begin
  select * into v_d from public.demandes where id = p_demande for update;
  if v_d.id is null then
    raise exception 'Cette demande ne vous est plus proposée.';
  end if;
  if v_d.statut <> 'en_attente' then
    if v_d.statut in ('acceptee', 'en_cours') and v_d.intervenant_id is distinct from v_uid then
      raise exception 'Un autre intervenant a déjà accepté cette demande.';
    end if;
    raise exception 'Cette demande ne vous est plus proposée.';
  end if;
  if not exists (
    select 1 from public.demande_propositions
    where demande_id = p_demande and intervenant_id = v_uid and active
  ) then
    raise exception 'Cette demande ne vous est plus proposée.';
  end if;

  if p_accepter then
    if p_transport is not null and p_transport not in ('a_pied', 'trottinette', 'velo', 'voiture', 'transports') then
      raise exception 'Moyen de transport inconnu.';
    end if;
    if p_eta_minutes is not null and p_eta_minutes not between 1 and 720 then
      raise exception 'Délai d''arrivée invalide.';
    end if;
    -- Le premier qui accepte prend la demande : les autres la perdent
    update public.demandes
    set statut = 'acceptee', intervenant_id = v_uid, transport = p_transport, eta_minutes = p_eta_minutes,
        acceptee_le = now(), confirmee = false, annulee_par = null, motif_annulation = null
    where id = p_demande;
    update public.demande_propositions set active = false where demande_id = p_demande and active;
  else
    insert into public.demande_refus (demande_id, intervenant_id)
    values (p_demande, v_uid) on conflict do nothing;
    update public.demande_propositions set active = false
    where demande_id = p_demande and intervenant_id = v_uid;
  end if;
end;
$$;

-- ---------- Demandeur : confirmer, ou chercher quelqu'un d'autre ----------
create or replace function public.confirmer_intervenant(p_demande uuid, p_confirmer boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_d public.demandes;
begin
  select * into v_d from public.demandes
  where id = p_demande and demandeur_id = auth.uid() and statut = 'acceptee'
  for update;
  if v_d.id is null then
    raise exception 'Cette demande ne peut plus être confirmée.';
  end if;

  if p_confirmer then
    update public.demandes set confirmee = true where id = p_demande;
  else
    if v_d.intervenant_id is not null then
      insert into public.demande_refus (demande_id, intervenant_id)
      values (p_demande, v_d.intervenant_id) on conflict do nothing;
    end if;
    update public.demandes
    set statut = 'en_attente', intervenant_id = null, transport = null, eta_minutes = null,
        acceptee_le = null, confirmee = false, recherche_depuis = now(),
        annulee_par = null, motif_annulation = null
    where id = p_demande;
    -- La demande repart chez tous les proches
    perform public.attribuer_demande(p_demande);
  end if;
end;
$$;

-- ---------- Intervenant : annuler sa venue → la demande repart chez tous les proches ----------
create or replace function public.annuler_intervention(p_demande uuid, p_motif text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if coalesce(btrim(p_motif), '') = '' then
    raise exception 'Indiquez le motif de l''annulation.';
  end if;
  if not exists (
    select 1 from public.demandes
    where id = p_demande and intervenant_id = v_uid and statut in ('acceptee', 'en_cours')
  ) then
    raise exception 'Cette demande ne peut plus être annulée.';
  end if;

  -- Il ne la recevra plus
  insert into public.demande_refus (demande_id, intervenant_id)
  values (p_demande, v_uid) on conflict do nothing;

  update public.demandes
  set statut = 'en_attente', intervenant_id = null, transport = null, eta_minutes = null,
      acceptee_le = null, confirmee = false, recherche_depuis = now(),
      annulee_par = 'intervenant', motif_annulation = left(btrim(p_motif), 300)
  where id = p_demande;

  perform public.attribuer_demande(p_demande);
end;
$$;

-- ---------- Délai automatique ----------
--  - personne n'a accepté après 15 min (ou à l'heure prévue pour une demande
--    programmée, 48 h au plus) : la demande expire ;
--  - le demandeur n'a pas confirmé au bout de 10 min : confirmé d'office.
create or replace function public.expirer_demandes()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.demandes
  set confirmee = true
  where statut = 'acceptee' and not confirmee and acceptee_le < now() - interval '10 minutes';

  update public.demandes
  set statut = 'expiree', annulee_par = 'systeme'
  where statut = 'en_attente'
    and (
      (programmee_pour is null and recherche_depuis < now() - interval '15 minutes')
      or (programmee_pour is not null and (programmee_pour < now() or recherche_depuis < now() - interval '48 hours'))
    );
end;
$$;

-- ---------- Notifications ----------
create or replace function public.evenements_demande() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if old.statut is distinct from new.statut then
      if new.statut in ('acceptee', 'en_cours', 'terminee') then
        perform public.notifier(new.id, new.statut::text, new.demandeur_id);
      elsif new.statut = 'expiree' then
        perform public.notifier(new.id, 'expiree', new.demandeur_id);
      elsif new.statut = 'annulee' and new.annulee_par = 'demandeur' then
        perform public.notifier(new.id, 'annulee', new.intervenant_id);
      elsif old.statut in ('acceptee', 'en_cours') and new.statut = 'en_attente' then
        if new.annulee_par = 'intervenant' then
          -- L'intervenant a annulé : le demandeur est prévenu, la recherche repart
          perform public.notifier(new.id, 'relance', new.demandeur_id);
        else
          -- Le demandeur a préféré quelqu'un d'autre
          perform public.notifier(new.id, 'refusee', old.intervenant_id);
        end if;
      end if;
      -- Plus en attente : la demande n'est plus proposée à personne
      if new.statut <> 'en_attente' then
        update public.demande_propositions set active = false where demande_id = new.id and active;
      end if;
    end if;
    if not old.confirmee and new.confirmee and new.statut = 'acceptee' then
      perform public.notifier(new.id, 'confirmee', new.intervenant_id);
    end if;
  end if;
  return new;
end $$;

-- Chaque intervenant à qui la demande est (de nouveau) proposée reçoit « Nouvelle demande »
create or replace function prive.evenement_proposition() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.active and (tg_op = 'INSERT' or not old.active) then
    perform public.notifier(new.demande_id, 'nouvelle', new.intervenant_id);
  end if;
  return new;
end $$;
create or replace trigger propositions_notification
  after insert or update of active on public.demande_propositions
  for each row execute function prive.evenement_proposition();

-- Distance : calculée avec l'intervenant concerné (celui qui a la demande, sinon le destinataire)
create or replace function public.infos_notification(p_demande uuid, p_destinataire uuid) returns json
language sql stable security definer set search_path = '' as $$
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
    ), '[]'::json)
  )
  from public.demandes d
  join public.services s on s.id = d.service_id
  join public.profiles pd on pd.id = d.demandeur_id
  left join public.profiles pi on pi.id = d.intervenant_id
  left join public.intervenants i on i.id = coalesce(d.intervenant_id, p_destinataire)
  left join public.profiles dest on dest.id = p_destinataire
  where d.id = p_demande;
$$;

-- ---------- Tableaux de bord ----------
create or replace function public.tableau_demandeur()
returns json
language sql
stable security definer
set search_path = ''
as $$
  select json_build_object(
    'demandes', coalesce((
      select json_agg(json_build_object(
        'id', d.id, 'statut', d.statut, 'created_at', d.created_at, 'updated_at', d.updated_at,
        'service', s.nom, 'service_noms', public.noms_service(s),
        'espace_slug', e.slug, 'espace_nom', e.nom,
        'adresse', d.adresse, 'message', d.message,
        'programmee_pour', d.programmee_pour,
        'recherche_depuis', d.recherche_depuis,
        'annulee_par', d.annulee_par, 'motif_annulation', d.motif_annulation,
        'nb_proposes', (select count(*) from public.demande_propositions x where x.demande_id = d.id and x.active),
        'intervenant_trouve', d.intervenant_id is not null
          or exists (select 1 from public.demande_propositions x where x.demande_id = d.id and x.active),
        'intervenant_prenom', case when d.statut in ('acceptee', 'en_cours', 'terminee') then p.prenom end,
        'intervenant_nom', case when d.statut in ('acceptee', 'en_cours', 'terminee') then p.nom end,
        'intervenant_photo', case when d.statut in ('acceptee', 'en_cours', 'terminee') then p.photo_url end,
        'intervenant_telephone', case when d.statut in ('acceptee', 'en_cours') then p.telephone end,
        'intervenant_type', case when d.statut in ('acceptee', 'en_cours', 'terminee') then i.type end,
        'transport', case when d.statut in ('acceptee', 'en_cours') then d.transport end,
        'eta_minutes', case when d.statut in ('acceptee', 'en_cours') then d.eta_minutes end,
        'acceptee_le', d.acceptee_le,
        'confirmee', d.confirmee,
        'distance_m', case when d.statut in ('acceptee', 'en_cours') and i.position is not null
                           then round(extensions.st_distance(d.position, i.position)) end,
        'intervenant_avis', case when d.statut in ('acceptee', 'en_cours') and d.intervenant_id is not null then (
          select json_build_object(
            'moyenne', round(avg(a2.note)::numeric, 1),
            'nombre', count(a2.*),
            'liste', coalesce(json_agg(json_build_object(
                'prenom', pa.prenom, 'initiale', left(coalesce(pa.nom, ''), 1),
                'note', a2.note, 'commentaire', a2.commentaire, 'created_at', a2.created_at
              ) order by a2.created_at desc) filter (where a2.id is not null), '[]'::json)
          )
          from public.avis a2
          join public.demandes d2 on d2.id = a2.demande_id
          join public.profiles pa on pa.id = d2.demandeur_id
          where d2.intervenant_id = d.intervenant_id
        ) end,
        'note', a.note,
        'commentaire', a.commentaire
      ) order by coalesce(d.programmee_pour, d.created_at) desc)
      from public.demandes d
      join public.services s on s.id = d.service_id
      join public.espaces e on e.id = s.espace_id
      left join public.intervenants i on i.id = d.intervenant_id
      left join public.profiles p on p.id = d.intervenant_id
      left join public.avis a on a.demande_id = d.id
      where d.demandeur_id = auth.uid()
    ), '[]'::json)
  );
$$;

create or replace function public.tableau_intervenant()
returns json
language sql
stable security definer
set search_path = ''
as $$
  with moi as (
    select i.*, e.slug as espace_slug, e.nom as espace_nom
    from public.intervenants i
    join public.espaces e on e.id = i.espace_id
    where i.id = auth.uid()
  ),
  -- Les demandes qu'il a prises + celles qui lui sont proposées en ce moment
  mes_demandes as (
    select d.*, s.nom as service_nom, public.noms_service(s) as service_noms,
           d.intervenant_id = auth.uid() and d.statut in ('acceptee', 'en_cours') as telephone_visible,
           d.intervenant_id = auth.uid() and d.statut in ('acceptee', 'en_cours', 'terminee') as acceptee
    from public.demandes d
    join public.services s on s.id = d.service_id
    where d.intervenant_id = auth.uid()
       or (d.statut = 'en_attente' and exists (
             select 1 from public.demande_propositions x
             where x.demande_id = d.id and x.intervenant_id = auth.uid() and x.active))
  ),
  mes_avis as (
    select a.*, p.prenom, p.nom, p.photo_url, s.nom as service_nom, public.noms_service(s) as service_noms
    from public.avis a
    join public.demandes d on d.id = a.demande_id
    join public.services s on s.id = d.service_id
    join public.profiles p on p.id = d.demandeur_id
    where d.intervenant_id = auth.uid()
  )
  select json_build_object(
    'intervenant', (
      select json_build_object(
        'type', m.type, 'validation', m.validation, 'disponible', m.disponible,
        'rayon_km', m.rayon_km, 'espace_slug', m.espace_slug, 'espace_nom', m.espace_nom,
        'lat', extensions.st_y(m.position::extensions.geometry),
        'lng', extensions.st_x(m.position::extensions.geometry),
        'adresse', m.adresse
      ) from moi m
    ),
    'demandes', coalesce((
      select json_agg(json_build_object(
        'id', d.id, 'statut', d.statut, 'created_at', d.created_at, 'updated_at', d.updated_at,
        'service', d.service_nom, 'service_noms', d.service_noms, 'message', d.message,
        'distance_m', (select round(extensions.st_distance(d.position, m.position)) from moi m),
        'adresse', d.adresse,
        'lat', extensions.st_y(d.position::extensions.geometry),
        'lng', extensions.st_x(d.position::extensions.geometry),
        'programmee_pour', d.programmee_pour,
        'recherche_depuis', d.recherche_depuis,
        'attribuee_le', d.attribuee_le,
        'nb_proposes', (select count(*) from public.demande_propositions x where x.demande_id = d.id and x.active),
        'transport', d.transport,
        'eta_minutes', d.eta_minutes,
        'confirmee', d.confirmee,
        'annulee_par', d.annulee_par,
        'motif_annulation', d.motif_annulation,
        'demandeur_prenom', p.prenom,
        'demandeur_nom', p.nom,
        'demandeur_photo', p.photo_url,
        'demandeur_telephone', case when d.telephone_visible then coalesce(d.telephone, p.telephone) end,
        'demandeur_id', case when d.acceptee then d.demandeur_id end
      ) order by coalesce(d.programmee_pour, d.created_at) desc)
      from mes_demandes d
      join public.profiles p on p.id = d.demandeur_id
    ), '[]'::json),
    'services', coalesce((
      select json_agg(json_build_object(
        'id', s.id, 'nom', s.nom, 'noms', public.noms_service(s),
        'propose', exists (
          select 1 from public.intervenant_services x
          where x.intervenant_id = auth.uid() and x.service_id = s.id
        )
      ) order by s.ordre)
      from public.services s
      where s.espace_id = (select espace_id from moi) and s.actif
    ), '[]'::json),
    'avis', json_build_object(
      'moyenne', (select round(avg(note)::numeric, 1) from mes_avis),
      'nombre', (select count(*) from mes_avis),
      'liste', coalesce((
        select json_agg(json_build_object(
          'id', a.id, 'note', a.note, 'commentaire', a.commentaire, 'created_at', a.created_at,
          'prenom', a.prenom, 'nom', a.nom, 'photo', a.photo_url,
          'service', a.service_nom, 'service_noms', a.service_noms
        ) order by a.created_at desc)
        from mes_avis a
      ), '[]'::json)
    )
  );
$$;
