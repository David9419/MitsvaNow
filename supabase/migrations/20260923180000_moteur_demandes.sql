-- =====================================================================
-- Moteur des demandes et des tableaux de bord
--  - attribution automatique à l'intervenant disponible le plus proche
--  - accepter / refuser (si refus : on passe au suivant)
--  - avancer le statut (acceptée → en cours → terminée), annuler
--  - disponibilité + position GPS des intervenants
--  - données des tableaux de bord (demandeur / intervenant)
--  - temps réel sur la table des demandes
-- Toutes les fonctions vérifient qui appelle (auth.uid()).
-- =====================================================================

-- ---------- Temps réel ----------
alter publication supabase_realtime add table public.demandes;

-- ---------- Outil : point GPS ----------
create function public.point_gps(p_lat double precision, p_lng double precision)
returns extensions.geography
language sql
immutable
set search_path = ''
as $$
  select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
$$;

-- ---------- Attribution à l'intervenant le plus proche (usage interne) ----------
create function public.attribuer_demande(p_demande uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_d public.demandes;
  v_espace uuid;
  v_intervenant uuid;
begin
  select * into v_d from public.demandes where id = p_demande for update;
  if v_d.id is null or v_d.statut <> 'en_attente' then
    return null;
  end if;

  select s.espace_id into v_espace from public.services s where s.id = v_d.service_id;

  select i.id into v_intervenant
  from public.intervenants i
  where i.espace_id = v_espace
    and i.validation = 'valide'
    and i.disponible
    and i.position is not null
    and i.id <> v_d.demandeur_id
    and extensions.st_dwithin(i.position, v_d.position, i.rayon_km * 1000)
    -- l'intervenant propose ce service (ou n'a rien restreint)
    and (
      not exists (select 1 from public.intervenant_services x where x.intervenant_id = i.id)
      or exists (
        select 1 from public.intervenant_services x
        where x.intervenant_id = i.id and x.service_id = v_d.service_id
      )
    )
    -- il n'a pas déjà refusé cette demande
    and not exists (
      select 1 from public.demande_refus r
      where r.demande_id = v_d.id and r.intervenant_id = i.id
    )
  order by extensions.st_distance(i.position, v_d.position)
  limit 1;

  update public.demandes set intervenant_id = v_intervenant where id = v_d.id;
  return v_intervenant;
end;
$$;
revoke execute on function public.attribuer_demande(uuid) from public, anon, authenticated;

-- ---------- Demandeur : créer une demande ----------
create function public.creer_demande(
  p_service uuid,
  p_lat double precision,
  p_lng double precision,
  p_adresse text default null,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Vous devez être connecté.';
  end if;
  if not exists (select 1 from public.services where id = p_service and actif) then
    raise exception 'Service introuvable.';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Position invalide.';
  end if;
  if (select count(*) from public.demandes
      where demandeur_id = v_uid and statut in ('en_attente', 'acceptee', 'en_cours')) >= 3 then
    raise exception 'Vous avez déjà 3 demandes en cours.';
  end if;

  insert into public.demandes (demandeur_id, service_id, position, adresse, message)
  values (v_uid, p_service, public.point_gps(p_lat, p_lng), left(p_adresse, 300), left(p_message, 1000))
  returning id into v_id;

  perform public.attribuer_demande(v_id);
  return v_id;
end;
$$;
revoke execute on function public.creer_demande(uuid, double precision, double precision, text, text) from public, anon;
grant execute on function public.creer_demande(uuid, double precision, double precision, text, text) to authenticated;

-- ---------- Demandeur : annuler ----------
create function public.annuler_demande(p_demande uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.demandes
  set statut = 'annulee'
  where id = p_demande
    and demandeur_id = auth.uid()
    and statut in ('en_attente', 'acceptee');
  if not found then
    raise exception 'Cette demande ne peut plus être annulée.';
  end if;
end;
$$;
revoke execute on function public.annuler_demande(uuid) from public, anon;
grant execute on function public.annuler_demande(uuid) to authenticated;

-- ---------- Intervenant : accepter ou refuser ----------
create function public.repondre_demande(p_demande uuid, p_accepter boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not exists (
    select 1 from public.demandes
    where id = p_demande and intervenant_id = v_uid and statut = 'en_attente'
  ) then
    raise exception 'Cette demande ne vous est plus proposée.';
  end if;

  if p_accepter then
    update public.demandes set statut = 'acceptee' where id = p_demande;
  else
    insert into public.demande_refus (demande_id, intervenant_id)
    values (p_demande, v_uid) on conflict do nothing;
    update public.demandes set intervenant_id = null where id = p_demande;
    perform public.attribuer_demande(p_demande);
  end if;
end;
$$;
revoke execute on function public.repondre_demande(uuid, boolean) from public, anon;
grant execute on function public.repondre_demande(uuid, boolean) to authenticated;

-- ---------- Intervenant : acceptée → en cours → terminée ----------
create function public.avancer_demande(p_demande uuid)
returns public.statut_demande
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_statut public.statut_demande;
begin
  update public.demandes
  set statut = case statut when 'acceptee' then 'en_cours'::public.statut_demande
                           else 'terminee'::public.statut_demande end
  where id = p_demande
    and intervenant_id = auth.uid()
    and statut in ('acceptee', 'en_cours')
  returning statut into v_statut;
  if v_statut is null then
    raise exception 'Action impossible sur cette demande.';
  end if;
  return v_statut;
end;
$$;
revoke execute on function public.avancer_demande(uuid) from public, anon;
grant execute on function public.avancer_demande(uuid) to authenticated;

-- ---------- Intervenant : disponibilité, position, rayon ----------
create function public.mettre_a_jour_intervenant(
  p_disponible boolean default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_rayon_km numeric default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_i public.intervenants;
  v_d record;
begin
  update public.intervenants
  set disponible = coalesce(p_disponible, disponible),
      position = case when p_lat is not null and p_lng is not null
                      then public.point_gps(p_lat, p_lng) else position end,
      rayon_km = case when p_rayon_km between 1 and 200 then p_rayon_km else rayon_km end
  where id = auth.uid()
  returning * into v_i;

  if v_i.id is null then
    raise exception 'Vous n''êtes pas intervenant.';
  end if;

  -- Plus disponible : ses propositions en attente passent au suivant
  if not v_i.disponible then
    for v_d in
      select d.id from public.demandes d
      where d.intervenant_id = v_i.id and d.statut = 'en_attente'
    loop
      update public.demandes set intervenant_id = null where id = v_d.id;
      perform public.attribuer_demande(v_d.id);
    end loop;
  end if;

  -- Disponible et validé : on lui propose tout de suite les demandes
  -- proches qui attendent encore quelqu'un.
  if v_i.disponible and v_i.validation = 'valide' and v_i.position is not null then
    for v_d in
      select d.id
      from public.demandes d
      join public.services s on s.id = d.service_id
      where d.statut = 'en_attente'
        and d.intervenant_id is null
        and s.espace_id = v_i.espace_id
        and extensions.st_dwithin(d.position, v_i.position, v_i.rayon_km * 1000)
      order by d.created_at
    loop
      perform public.attribuer_demande(v_d.id);
    end loop;
  end if;
end;
$$;
revoke execute on function public.mettre_a_jour_intervenant(boolean, double precision, double precision, numeric) from public, anon;
grant execute on function public.mettre_a_jour_intervenant(boolean, double precision, double precision, numeric) to authenticated;

-- ---------- Tableau de bord : intervenant ----------
-- L'adresse, la position exacte et le téléphone du demandeur ne sont
-- visibles qu'après acceptation. Avant : seulement la distance.
create function public.tableau_intervenant()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with moi as (
    select i.*, e.slug as espace_slug, e.nom as espace_nom
    from public.intervenants i
    join public.espaces e on e.id = i.espace_id
    where i.id = auth.uid()
  ),
  mes_demandes as (
    select d.*, s.nom as service_nom,
           d.statut in ('acceptee', 'en_cours', 'terminee') as details_visibles
    from public.demandes d
    join public.services s on s.id = d.service_id
    where d.intervenant_id = auth.uid()
  )
  select json_build_object(
    'intervenant', (
      select json_build_object(
        'type', m.type, 'validation', m.validation, 'disponible', m.disponible,
        'rayon_km', m.rayon_km, 'espace_slug', m.espace_slug, 'espace_nom', m.espace_nom,
        'lat', extensions.st_y(m.position::extensions.geometry),
        'lng', extensions.st_x(m.position::extensions.geometry)
      ) from moi m
    ),
    'demandes', coalesce((
      select json_agg(json_build_object(
        'id', d.id, 'statut', d.statut, 'created_at', d.created_at, 'updated_at', d.updated_at,
        'service', d.service_nom, 'message', d.message,
        'distance_m', (select round(extensions.st_distance(d.position, m.position)) from moi m),
        'adresse', case when d.details_visibles then d.adresse end,
        'lat', case when d.details_visibles then extensions.st_y(d.position::extensions.geometry) end,
        'lng', case when d.details_visibles then extensions.st_x(d.position::extensions.geometry) end,
        'demandeur_prenom', p.prenom,
        'demandeur_nom', case when d.details_visibles then p.nom end,
        'demandeur_telephone', case when d.details_visibles then p.telephone end,
        'demandeur_id', case when d.details_visibles then d.demandeur_id end
      ) order by d.created_at desc)
      from mes_demandes d
      join public.profiles p on p.id = d.demandeur_id
    ), '[]'::json),
    'services', coalesce((
      select json_agg(json_build_object(
        'id', s.id, 'nom', s.nom,
        'propose', exists (
          select 1 from public.intervenant_services x
          where x.intervenant_id = auth.uid() and x.service_id = s.id
        )
      ) order by s.ordre)
      from public.services s
      where s.espace_id = (select espace_id from moi) and s.actif
    ), '[]'::json)
  );
$$;
revoke execute on function public.tableau_intervenant() from public, anon;
grant execute on function public.tableau_intervenant() to authenticated;

-- ---------- Tableau de bord : demandeur ----------
-- Les informations de l'intervenant ne sont visibles qu'après acceptation.
create function public.tableau_demandeur()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'demandes', coalesce((
      select json_agg(json_build_object(
        'id', d.id, 'statut', d.statut, 'created_at', d.created_at, 'updated_at', d.updated_at,
        'service', s.nom, 'espace_slug', e.slug, 'espace_nom', e.nom,
        'adresse', d.adresse, 'message', d.message,
        'intervenant_trouve', d.intervenant_id is not null,
        'intervenant_prenom', case when d.statut in ('acceptee', 'en_cours', 'terminee') then p.prenom end,
        'intervenant_telephone', case when d.statut in ('acceptee', 'en_cours') then p.telephone end,
        'intervenant_type', case when d.statut in ('acceptee', 'en_cours', 'terminee') then i.type end,
        'distance_m', case when d.statut in ('acceptee', 'en_cours') and i.position is not null
                           then round(extensions.st_distance(d.position, i.position)) end,
        'note', a.note
      ) order by d.created_at desc)
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
revoke execute on function public.tableau_demandeur() from public, anon;
grant execute on function public.tableau_demandeur() to authenticated;

revoke execute on function public.point_gps(double precision, double precision) from public, anon;
grant execute on function public.point_gps(double precision, double precision) to authenticated;
