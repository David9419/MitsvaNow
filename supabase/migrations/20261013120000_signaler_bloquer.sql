-- =====================================================================
-- « Signaler » et « Bloquer » une personne (obligatoire pour l'App Store)
--
-- - Signaler : depuis une demande, le demandeur signale l'intervenant (ou l'inverse).
--   Les administrateurs voient les signalements dans la page Administration.
-- - Bloquer : les deux personnes ne sont plus jamais mises en relation
--   (prive.peut_recevoir les exclut). Débloquer = colonne « actif » à false.
-- On ne passe jamais par l'identifiant d'une personne : tout part d'une demande
-- qui les relie déjà, pour que personne ne puisse viser un inconnu.
-- =====================================================================

create table if not exists public.signalements (
  id uuid primary key default gen_random_uuid(),
  auteur_id uuid references public.profiles (id) on delete set null,
  cible_id uuid not null references public.profiles (id) on delete cascade,
  demande_id uuid references public.demandes (id) on delete set null,
  motif text not null check (motif in ('comportement', 'harcelement', 'faux_profil', 'absence', 'danger', 'autre')),
  details text,
  bloque boolean not null default false,
  statut text not null default 'nouveau' check (statut in ('nouveau', 'traite')),
  created_at timestamptz not null default now(),
  traite_le timestamptz,
  traite_par uuid references public.profiles (id) on delete set null
);
create index if not exists signalements_statut_idx on public.signalements (statut, created_at desc);
alter table public.signalements enable row level security;
create policy "Admins : voir les signalements"
  on public.signalements for select to authenticated
  using ((select public.est_admin()));

create table if not exists public.blocages (
  bloqueur_id uuid not null references public.profiles (id) on delete cascade,
  bloque_id uuid not null references public.profiles (id) on delete cascade,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (bloqueur_id, bloque_id),
  check (bloqueur_id <> bloque_id)
);
alter table public.blocages enable row level security;
create policy "Voir les personnes que j'ai bloquées"
  on public.blocages for select to authenticated
  using (bloqueur_id = (select auth.uid()));

-- Vrai si l'une des deux personnes a bloqué l'autre
create or replace function prive.est_bloque(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocages b
    where b.actif
      and ((b.bloqueur_id = p_a and b.bloque_id = p_b) or (b.bloqueur_id = p_b and b.bloque_id = p_a))
  );
$$;

-- La personne liée à moi par cette demande (l'autre côté), ou null
create or replace function prive.autre_personne(p_demande uuid, p_moi uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when d.demandeur_id = p_moi then d.intervenant_id
    when d.intervenant_id = p_moi
      or exists (select 1 from public.demande_propositions x where x.demande_id = d.id and x.intervenant_id = p_moi)
      or exists (select 1 from public.demande_refus x where x.demande_id = d.id and x.intervenant_id = p_moi)
      then d.demandeur_id
  end
  from public.demandes d
  where d.id = p_demande;
$$;

-- Bloque et retire tout de suite les demandes en cours de proposition entre les deux
create or replace function prive.bloquer(p_qui uuid, p_cible uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.blocages (bloqueur_id, bloque_id)
  values (p_qui, p_cible)
  on conflict (bloqueur_id, bloque_id) do update set actif = true, created_at = now();

  update public.demande_propositions p
  set active = false
  from public.demandes d
  where p.demande_id = d.id
    and p.active
    and d.statut = 'en_attente'
    and ((p.intervenant_id = p_qui and d.demandeur_id = p_cible)
      or (p.intervenant_id = p_cible and d.demandeur_id = p_qui));
end;
$$;

-- Les personnes bloquées ne sont plus mises en relation
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
    join public.profiles pr on pr.id = i.id
    where d.id = p_demande
      and d.statut = 'en_attente'
      and i.espace_id = s.espace_id
      and i.validation = 'valide'
      and pr.verification = 'valide'
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
      and not prive.est_bloque(i.id, d.demandeur_id)
  );
$$;

-- Signaler la personne liée à une demande (et la bloquer si demandé)
create or replace function public.signaler(
  p_demande uuid, p_motif text, p_details text default null, p_bloquer boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cible uuid;
begin
  perform prive.exiger_compte_valide();
  if p_motif is null or p_motif not in ('comportement', 'harcelement', 'faux_profil', 'absence', 'danger', 'autre') then
    raise exception 'Choisissez la raison du signalement.';
  end if;
  v_cible := prive.autre_personne(p_demande, v_uid);
  if v_cible is null or v_cible = v_uid then
    raise exception 'Impossible de signaler cette personne.';
  end if;
  if (select count(*) from public.signalements
      where auteur_id = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Trop de signalements aujourd''hui. Réessayez demain.';
  end if;

  insert into public.signalements (auteur_id, cible_id, demande_id, motif, details, bloque)
  values (v_uid, v_cible, p_demande, p_motif, left(nullif(btrim(p_details), ''), 1000), coalesce(p_bloquer, false));

  if p_bloquer then
    perform prive.bloquer(v_uid, v_cible);
  end if;
end;
$$;

-- Bloquer sans signaler
create or replace function public.bloquer_personne(p_demande uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cible uuid;
begin
  perform prive.exiger_compte_valide();
  v_cible := prive.autre_personne(p_demande, v_uid);
  if v_cible is null or v_cible = v_uid then
    raise exception 'Impossible de bloquer cette personne.';
  end if;
  perform prive.bloquer(v_uid, v_cible);
end;
$$;

-- Débloquer (depuis les Paramètres)
create or replace function public.debloquer_personne(p_personne uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.blocages set actif = false
  where bloqueur_id = (select auth.uid()) and bloque_id = p_personne;
$$;

-- Mes personnes bloquées
create or replace function public.mes_blocages()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'prenom', p.prenom, 'nom', p.nom, 'photo', p.photo_url, 'depuis', b.created_at
  ) order by b.created_at desc), '[]'::jsonb)
  from public.blocages b
  join public.profiles p on p.id = b.bloque_id
  where b.bloqueur_id = (select auth.uid()) and b.actif;
$$;

-- Administration : liste des signalements
create or replace function public.admin_signalements()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;
  return coalesce((
    select jsonb_agg(x order by x.ordre, x.created_at desc)
    from (
      select
        s.id, s.motif, s.details, s.bloque, s.statut, s.created_at, s.traite_le,
        case s.statut when 'nouveau' then 0 else 1 end as ordre,
        nullif(btrim(concat_ws(' ', tp.prenom, tp.nom)), '') as traite_par_nom,
        jsonb_build_object('id', a.id, 'prenom', a.prenom, 'nom', a.nom, 'telephone', a.telephone,
                           'photo', a.photo_url) as auteur,
        jsonb_build_object('id', c.id, 'prenom', c.prenom, 'nom', c.nom, 'telephone', c.telephone,
                           'photo', c.photo_url, 'verification', c.verification,
                           'type_intervenant', ci.type,
                           'nb_signalements', (select count(*) from public.signalements z where z.cible_id = c.id)) as cible,
        sv.nom as service, public.noms_service(sv) as service_noms
      from public.signalements s
      join public.profiles c on c.id = s.cible_id
      left join public.intervenants ci on ci.id = c.id
      left join public.profiles a on a.id = s.auteur_id
      left join public.profiles tp on tp.id = s.traite_par
      left join public.demandes d on d.id = s.demande_id
      left join public.services sv on sv.id = d.service_id
    ) x
  ), '[]'::jsonb);
end;
$$;

-- Administration : marquer un signalement comme traité (ou le rouvrir)
create or replace function public.admin_traiter_signalement(p_signalement uuid, p_traite boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;
  update public.signalements
  set statut = case when p_traite then 'traite' else 'nouveau' end,
      traite_le = case when p_traite then now() end,
      traite_par = case when p_traite then auth.uid() end
  where id = p_signalement;
end;
$$;

grant execute on function public.signaler(uuid, text, text, boolean) to authenticated;
grant execute on function public.bloquer_personne(uuid) to authenticated;
grant execute on function public.debloquer_personne(uuid) to authenticated;
grant execute on function public.mes_blocages() to authenticated;
grant execute on function public.admin_signalements() to authenticated;
grant execute on function public.admin_traiter_signalement(uuid, boolean) to authenticated;
