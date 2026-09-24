-- =====================================================================
-- 1. Position enregistrée dès l'inscription (lat, lng, adresse)
-- 2. L'intervenant à qui une demande est proposée voit tout de suite
--    le prénom, le nom, le service et l'adresse du demandeur
--    (le téléphone reste visible seulement après acceptation)
-- =====================================================================

create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := new.raw_user_meta_data;
  v_espace_slug text := v_meta ->> 'espace';
  v_type text := v_meta ->> 'type_intervenant';
  v_espace_id uuid;
  v_intervenant boolean;
  v_lat double precision;
  v_lng double precision;
  v_position extensions.geography;
  v_adresse text := left(v_meta ->> 'adresse', 300);
begin
  v_intervenant := v_espace_slug is not null and v_type is not null and (
    (v_espace_slug = 'bahourim' and v_type = 'bahour')
    or (v_espace_slug = 'equipe-feminine' and v_type = 'femme')
    or (v_espace_slug = 'sofer-rav-rabbanit' and v_type in ('sofer', 'rav', 'rabbanit'))
    or (v_espace_slug = 'chaliah' and v_type = 'chaliah')
  );

  -- Position donnée à l'inscription (si elle est valable)
  begin
    v_lat := (v_meta ->> 'lat')::double precision;
    v_lng := (v_meta ->> 'lng')::double precision;
  exception when others then
    v_lat := null;
    v_lng := null;
  end;
  if v_lat between -90 and 90 and v_lng between -180 and 180 then
    v_position := public.point_gps(v_lat, v_lng);
  else
    v_adresse := null;
  end if;

  select e.id into v_espace_id
  from public.espaces e
  where e.slug = case when v_intervenant then v_espace_slug else 'demandeurs' end;

  insert into public.profiles (id, prenom, nom, telephone, email, espace_id, position, adresse)
  values (
    new.id,
    coalesce(v_meta ->> 'prenom', ''),
    coalesce(v_meta ->> 'nom', ''),
    v_meta ->> 'telephone',
    new.email,
    v_espace_id,
    v_position,
    v_adresse
  );

  if v_intervenant and v_espace_id is not null then
    insert into public.intervenants (id, espace_id, type, position, adresse)
    values (new.id, v_espace_id, v_type::public.type_intervenant, v_position, v_adresse);
  end if;

  return new;
end;
$$;
revoke execute on function public.creer_profil() from public, anon, authenticated;

-- Tableau intervenant : nom + adresse visibles dès que la demande lui est proposée
create or replace function public.tableau_intervenant()
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
           d.statut in ('acceptee', 'en_cours') as telephone_visible,
           d.statut in ('acceptee', 'en_cours', 'terminee') as acceptee
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
        'lng', extensions.st_x(m.position::extensions.geometry),
        'adresse', m.adresse
      ) from moi m
    ),
    'demandes', coalesce((
      select json_agg(json_build_object(
        'id', d.id, 'statut', d.statut, 'created_at', d.created_at, 'updated_at', d.updated_at,
        'service', d.service_nom, 'message', d.message,
        'distance_m', (select round(extensions.st_distance(d.position, m.position)) from moi m),
        'adresse', d.adresse,
        'lat', extensions.st_y(d.position::extensions.geometry),
        'lng', extensions.st_x(d.position::extensions.geometry),
        'demandeur_prenom', p.prenom,
        'demandeur_nom', p.nom,
        'demandeur_telephone', case when d.telephone_visible then p.telephone end,
        'demandeur_id', case when d.acceptee then d.demandeur_id end
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
