-- =====================================================================
-- Numéro de téléphone donné avec chaque demande (obligatoire),
-- pour que l'intervenant puisse appeler la personne directement.
-- Visible par l'intervenant une fois la demande acceptée.
-- =====================================================================

alter table public.demandes add column telephone text;

drop function public.creer_demande(uuid, double precision, double precision, text, text);

create function public.creer_demande(
  p_service uuid,
  p_lat double precision,
  p_lng double precision,
  p_telephone text,
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
  v_telephone text := btrim(p_telephone);
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
  if v_telephone is null or v_telephone !~ '^[+0-9 ().-]{8,20}$' then
    raise exception 'Le numéro de téléphone n''a pas l''air valide.';
  end if;
  if (select count(*) from public.demandes
      where demandeur_id = v_uid and statut in ('en_attente', 'acceptee', 'en_cours')) >= 3 then
    raise exception 'Vous avez déjà 3 demandes en cours.';
  end if;

  insert into public.demandes (demandeur_id, service_id, position, adresse, message, telephone)
  values (v_uid, p_service, public.point_gps(p_lat, p_lng), left(p_adresse, 300), left(p_message, 1000), v_telephone)
  returning id into v_id;

  perform public.attribuer_demande(v_id);
  return v_id;
end;
$$;
revoke execute on function public.creer_demande(uuid, double precision, double precision, text, text, text) from public, anon;
grant execute on function public.creer_demande(uuid, double precision, double precision, text, text, text) to authenticated;

-- Tableau intervenant : le numéro de la demande (sinon celui du profil)
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
        'demandeur_telephone', case when d.telephone_visible then coalesce(d.telephone, p.telephone) end,
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
