-- =====================================================================
-- Administration : tableau de bord (inscriptions, personnes en ligne,
-- répartition par rôle, demandes) + validation de tous les comptes existants
-- =====================================================================

-- 1. Tous les comptes inscrits à ce jour sont validés (demande de l'équipe, 13/10/2026)
do $$
declare
  v_admin uuid := (select id from public.profiles where est_admin order by created_at limit 1);
  v record;
begin
  for v in
    select id, verification from public.profiles
    where not est_admin and (verification = 'en_attente' or (verification = 'valide' and verifie_par is null))
  loop
    update public.profiles
    set verification = 'valide', verifie_le = now(), verifie_par = v_admin,
        motif_verification = 'Validé en bloc : compte inscrit avant le 13/10/2026'
    where id = v.id;
    update public.intervenants set validation = 'valide' where id = v.id;
    insert into public.journal_verifications (utilisateur_id, admin_id, ancien, nouveau, motif)
    values (v.id, v_admin, v.verification, 'valide', 'Validé en bloc : compte inscrit avant le 13/10/2026');
  end loop;
end;
$$;

-- 2. Dernier passage sur le site (pour savoir qui est en ligne)
alter table public.profiles add column if not exists dernier_passage timestamptz;
create index if not exists profiles_dernier_passage_idx on public.profiles (dernier_passage desc);

-- Appelée toutes les minutes par les pages de l'espace connecté
create or replace function public.signaler_presence()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set dernier_passage = now()
  where id = (select auth.uid())
    and (dernier_passage is null or dernier_passage < now() - interval '30 seconds');
$$;
revoke execute on function public.signaler_presence() from public, anon;
grant execute on function public.signaler_presence() to authenticated;

-- 3. Liste des comptes : on ajoute le dernier passage
create or replace function public.admin_comptes()
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
        p.id, p.prenom, p.nom, p.email, p.telephone, p.photo_url, p.created_at,
        p.verification, p.communaute, p.referent, p.verifie_le, p.motif_verification, p.est_admin,
        p.dernier_passage,
        (p.verification = 'valide' and p.verifie_par is null) as valide_automatiquement,
        nullif(btrim(concat_ws(' ', v.prenom, v.nom)), '') as verifie_par_nom,
        e.slug as espace_slug,
        i.type as type_intervenant,
        i.disponible,
        case p.verification when 'en_attente' then 0 else 1 end as ordre
      from public.profiles p
      left join public.espaces e on e.id = p.espace_id
      left join public.intervenants i on i.id = p.id
      left join public.profiles v on v.id = p.verifie_par
    ) x
  ), '[]'::jsonb);
end;
$$;

-- 4. Tableau de bord de l'administrateur
create or replace function public.admin_statistiques()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_jour timestamptz := date_trunc('day', now(), 'Europe/Paris');
begin
  if not public.est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;

  return jsonb_build_object(
    'comptes', (
      select jsonb_build_object(
        'total', count(*),
        'en_attente', count(*) filter (where p.verification = 'en_attente'),
        'valides', count(*) filter (where p.verification = 'valide'),
        'bloques', count(*) filter (where p.verification in ('refuse', 'suspendu')),
        'aujourdhui', count(*) filter (where p.created_at >= v_jour),
        'semaine', count(*) filter (where p.created_at >= now() - interval '7 days'),
        'mois', count(*) filter (where p.created_at >= now() - interval '30 days'),
        'en_ligne', count(*) filter (where p.dernier_passage >= now() - interval '3 minutes'),
        'actifs_jour', count(*) filter (where p.dernier_passage >= v_jour)
      )
      from public.profiles p
    ),
    -- Nombre de comptes par rôle (demandeur, bahour, femme, sofer, rav, rabbanit, chaliah)
    'roles', (
      select coalesce(jsonb_object_agg(r.role, r.n), '{}'::jsonb)
      from (
        select coalesce(i.type::text, 'demandeur') as role, count(*) as n
        from public.profiles p left join public.intervenants i on i.id = p.id
        group by 1
      ) r
    ),
    -- Intervenants disponibles en ce moment, par rôle
    'disponibles', (
      select coalesce(jsonb_object_agg(r.role, r.n), '{}'::jsonb)
      from (
        select i.type::text as role, count(*) as n
        from public.intervenants i join public.profiles p on p.id = i.id
        where i.disponible and p.verification = 'valide'
        group by 1
      ) r
    ),
    -- Inscriptions et demandes des 30 derniers jours, jour par jour
    'par_jour', (
      select jsonb_agg(jsonb_build_object(
        'jour', to_char(j, 'YYYY-MM-DD'),
        'inscriptions', (select count(*) from public.profiles p
                         where p.created_at >= j and p.created_at < j + interval '1 day'),
        'demandes', (select count(*) from public.demandes d
                     where d.created_at >= j and d.created_at < j + interval '1 day')
      ) order by j)
      from generate_series(v_jour - interval '29 days', v_jour, interval '1 day') j
    ),
    'demandes', (
      select jsonb_build_object(
        'total', count(*),
        'en_attente', count(*) filter (where d.statut = 'en_attente'),
        'en_cours', count(*) filter (where d.statut in ('acceptee', 'en_cours')),
        'terminees', count(*) filter (where d.statut = 'terminee'),
        'annulees', count(*) filter (where d.statut = 'annulee'),
        'expirees', count(*) filter (where d.statut = 'expiree'),
        'aujourdhui', count(*) filter (where d.created_at >= v_jour),
        'semaine', count(*) filter (where d.created_at >= now() - interval '7 days')
      )
      from public.demandes d
    ),
    'avis', (
      select jsonb_build_object('nombre', count(*), 'moyenne', round(avg(a.note)::numeric, 1))
      from public.avis a
    ),
    -- Les services les plus demandés
    'services', (
      select coalesce(jsonb_agg(x order by x.n desc), '[]'::jsonb)
      from (
        select s.nom, public.noms_service(s) as noms, count(*) as n
        from public.demandes d join public.services s on s.id = d.service_id
        group by s.id
        order by count(*) desc
        limit 8
      ) x
    ),
    -- Personnes passées sur le site dans les 15 dernières minutes
    'en_ligne', (
      select coalesce(jsonb_agg(x order by x.dernier_passage desc), '[]'::jsonb)
      from (
        select p.id, p.prenom, p.nom, p.photo_url, p.dernier_passage,
               e.slug as espace_slug, i.type as type_intervenant, i.disponible
        from public.profiles p
        left join public.espaces e on e.id = p.espace_id
        left join public.intervenants i on i.id = p.id
        where p.dernier_passage >= now() - interval '15 minutes'
        order by p.dernier_passage desc
        limit 50
      ) x
    ),
    -- Les 10 dernières inscriptions
    'inscriptions', (
      select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb)
      from (
        select p.id, p.prenom, p.nom, p.photo_url, p.created_at, p.verification,
               e.slug as espace_slug, i.type as type_intervenant
        from public.profiles p
        left join public.espaces e on e.id = p.espace_id
        left join public.intervenants i on i.id = p.id
        order by p.created_at desc
        limit 10
      ) x
    ),
    -- Les 10 dernières demandes
    'dernieres_demandes', (
      select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb)
      from (
        select d.id, d.statut, d.created_at, s.nom as service, public.noms_service(s) as service_noms,
               dp.prenom as demandeur, ip.prenom as intervenant
        from public.demandes d
        join public.services s on s.id = d.service_id
        join public.profiles dp on dp.id = d.demandeur_id
        left join public.profiles ip on ip.id = d.intervenant_id
        order by d.created_at desc
        limit 10
      ) x
    ),
    -- Les intervenants qui ont le plus aidé
    'meilleurs', (
      select coalesce(jsonb_agg(x order by x.terminees desc), '[]'::jsonb)
      from (
        select p.id, p.prenom, p.nom, p.photo_url, i.type as type_intervenant,
               count(d.id) as terminees,
               round(avg(a.note)::numeric, 1) as moyenne
        from public.demandes d
        join public.intervenants i on i.id = d.intervenant_id
        join public.profiles p on p.id = i.id
        left join public.avis a on a.demande_id = d.id
        where d.statut = 'terminee'
        group by p.id, i.type
        order by count(d.id) desc
        limit 5
      ) x
    )
  );
end;
$$;
revoke execute on function public.admin_statistiques() from public, anon;
grant execute on function public.admin_statistiques() to authenticated;
