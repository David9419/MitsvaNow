-- =====================================================================
-- 1. Les 16 services officiels (4 par espace d'intervenants)
-- 2. Adresse réelle enregistrée avec la position GPS
--    - intervenants.adresse (utilisée pour trouver le plus proche)
--    - profiles.position + profiles.adresse (dernière position connue,
--      pré-remplit les demandes)
-- =====================================================================

-- ---------- 1. Services ----------
-- On retire les anciens services qui n'ont jamais servi,
-- et on désactive ceux qui ont servi (pour garder l'historique).
create temporary table nouveaux_services (slug text, nom text, ordre smallint) on commit drop;
insert into nouveaux_services values
  ('bahourim', 'Mettre les téfilines', 1),
  ('bahourim', 'Installation de mezouza', 2),
  ('bahourim', 'Remise d''une boîte de tsédaka', 3),
  ('bahourim', 'Livraison de Sefer / livre / siddour', 4),
  ('equipe-feminine', '''Hallot pour Chabbat', 1),
  ('equipe-feminine', 'Remise de bougies et horaires de Chabbat', 2),
  ('equipe-feminine', 'Apprendre le judaïsme / cours de Torah', 3),
  ('equipe-feminine', 'Aider à préparer Chabbat', 4),
  ('sofer-rav-rabbanit', 'Vérification de la cacheroute', 1),
  ('sofer-rav-rabbanit', 'Bérakhot ou aide dans une situation délicate', 2),
  ('sofer-rav-rabbanit', 'Question et accompagnement', 3),
  ('sofer-rav-rabbanit', 'Célébrer un mariage', 4),
  ('chaliah', 'Éducation juive', 1),
  ('chaliah', 'Préparation à la bar-mitsva', 2),
  ('chaliah', 'Apprendre la paracha', 3),
  ('chaliah', 'Visite aux personnes dans le besoin', 4);

-- Anciens services : supprimés s'ils n'ont jamais été demandés, sinon désactivés
delete from public.services s
where not exists (
    select 1 from nouveaux_services n join public.espaces e on e.slug = n.slug
    where e.id = s.espace_id and n.nom = s.nom
  )
  and not exists (select 1 from public.demandes d where d.service_id = s.id);

update public.services s
set actif = false
where not exists (
  select 1 from nouveaux_services n join public.espaces e on e.slug = n.slug
  where e.id = s.espace_id and n.nom = s.nom
);

delete from public.intervenant_services x
using public.services s
where s.id = x.service_id and not s.actif;

-- Nouveaux services (ou réactivés)
insert into public.services (espace_id, nom, ordre, actif)
select e.id, n.nom, n.ordre, true
from nouveaux_services n
join public.espaces e on e.slug = n.slug
on conflict (espace_id, nom) do update set ordre = excluded.ordre, actif = true;

update public.espaces set description = case slug
  when 'bahourim' then 'Téfilines, mezouza, boîte de tsédaka, livraison de livres : le bahour le plus proche vient vous voir.'
  when 'equipe-feminine' then '''Hallot, bougies et horaires de Chabbat, cours, préparation de Chabbat : une femme de l''équipe vient vous aider.'
  when 'sofer-rav-rabbanit' then 'Cacheroute, bérakhot, questions, accompagnement et mariages.'
  when 'chaliah' then 'Éducation juive, bar-mitsva, paracha et visites aux personnes dans le besoin.'
  else description end;

-- ---------- 2. Adresses ----------
alter table public.intervenants add column adresse text;
alter table public.profiles
  add column position extensions.geography (Point, 4326),
  add column adresse text;

-- Intervenant : on ajoute l'adresse à la mise à jour (nouvelle version de la fonction)
drop function public.mettre_a_jour_intervenant(boolean, double precision, double precision, numeric);

create function public.mettre_a_jour_intervenant(
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
  v_d record;
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

  -- La position du profil suit celle de l'intervenant
  if v_nouvelle_position then
    update public.profiles
    set position = public.point_gps(p_lat, p_lng), adresse = left(p_adresse, 300)
    where id = v_i.id;
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

  -- Disponible et validé : on lui propose tout de suite les demandes proches en attente
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
revoke execute on function public.mettre_a_jour_intervenant(boolean, double precision, double precision, numeric, text) from public, anon;
grant execute on function public.mettre_a_jour_intervenant(boolean, double precision, double precision, numeric, text) to authenticated;

-- Tout le monde (demandeurs compris) : enregistrer sa position et son adresse
create function public.enregistrer_ma_position(
  p_lat double precision,
  p_lng double precision,
  p_adresse text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Vous devez être connecté.';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Position invalide.';
  end if;
  update public.profiles
  set position = public.point_gps(p_lat, p_lng), adresse = left(p_adresse, 300)
  where id = auth.uid();
end;
$$;
revoke execute on function public.enregistrer_ma_position(double precision, double precision, text) from public, anon;
grant execute on function public.enregistrer_ma_position(double precision, double precision, text) to authenticated;

-- Ma position enregistrée (pour pré-remplir les demandes)
create function public.ma_position()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'lat', extensions.st_y(p.position::extensions.geometry),
    'lng', extensions.st_x(p.position::extensions.geometry),
    'adresse', p.adresse
  )
  from public.profiles p
  where p.id = auth.uid() and p.position is not null;
$$;
revoke execute on function public.ma_position() from public, anon;
grant execute on function public.ma_position() to authenticated;

-- Tableau intervenant : on renvoie aussi l'adresse enregistrée
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
        'lng', extensions.st_x(m.position::extensions.geometry),
        'adresse', m.adresse
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
