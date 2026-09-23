-- =====================================================================
-- Mivtsa Now — schéma initial
-- Tables : profiles, espaces, services, intervenants, intervenant_services,
--          demandes, demande_refus, avis
-- Choix validés :
--   - un compte est obligatoire pour faire une demande ;
--   - un intervenant doit être validé par un administrateur ;
--   - une même personne peut être demandeur ET intervenant ;
--   - les avis sont inclus dès maintenant.
-- =====================================================================

-- Géolocalisation
create extension if not exists postgis with schema extensions;

-- ---------- Types ----------
create type public.type_intervenant as enum ('bahour', 'femme', 'sofer', 'rav', 'rabbanit', 'chaliah');
create type public.statut_validation as enum ('en_attente', 'valide', 'refuse');
create type public.statut_demande as enum ('en_attente', 'acceptee', 'en_cours', 'terminee', 'annulee');

-- ---------- Tables ----------

-- Une ligne par personne inscrite (créée automatiquement à l'inscription).
-- Tout le monde peut faire une demande ; on est intervenant si on a une
-- ligne dans « intervenants » ; est_admin donne les droits d'administration.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null default '',
  nom text not null default '',
  telephone text,
  est_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.espaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  description text,
  ordre smallint not null default 0
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  espace_id uuid not null references public.espaces (id) on delete cascade,
  nom text not null,
  description text,
  actif boolean not null default true,
  ordre smallint not null default 0,
  unique (espace_id, nom)
);
create index services_espace_id_idx on public.services (espace_id);

create table public.intervenants (
  id uuid primary key references public.profiles (id) on delete cascade,
  espace_id uuid not null references public.espaces (id),
  type public.type_intervenant not null,
  validation public.statut_validation not null default 'en_attente',
  disponible boolean not null default false,
  position extensions.geography (Point, 4326),
  rayon_km numeric(5, 1) not null default 10 check (rayon_km > 0 and rayon_km <= 200),
  created_at timestamptz not null default now()
);
create index intervenants_espace_id_idx on public.intervenants (espace_id);
create index intervenants_position_idx on public.intervenants using gist (position);

create table public.intervenant_services (
  intervenant_id uuid not null references public.intervenants (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (intervenant_id, service_id)
);
create index intervenant_services_service_id_idx on public.intervenant_services (service_id);

create table public.demandes (
  id uuid primary key default gen_random_uuid(),
  demandeur_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id),
  intervenant_id uuid references public.intervenants (id) on delete set null,
  position extensions.geography (Point, 4326) not null,
  adresse text,
  message text,
  statut public.statut_demande not null default 'en_attente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index demandes_demandeur_id_idx on public.demandes (demandeur_id);
create index demandes_service_id_idx on public.demandes (service_id);
create index demandes_intervenant_id_idx on public.demandes (intervenant_id);
create index demandes_statut_idx on public.demandes (statut);
create index demandes_position_idx on public.demandes using gist (position);

-- Intervenants qui ont refusé une demande (pour passer au suivant).
create table public.demande_refus (
  demande_id uuid not null references public.demandes (id) on delete cascade,
  intervenant_id uuid not null references public.intervenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (demande_id, intervenant_id)
);
create index demande_refus_intervenant_id_idx on public.demande_refus (intervenant_id);

create table public.avis (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null unique references public.demandes (id) on delete cascade,
  note smallint not null check (note between 1 and 5),
  commentaire text,
  created_at timestamptz not null default now()
);

-- ---------- Fonctions utilitaires ----------

create function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.est_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;
revoke execute on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- Crée le profil automatiquement à l'inscription.
create function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, prenom, nom, telephone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'prenom', ''),
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    new.raw_user_meta_data ->> 'telephone'
  );
  return new;
end;
$$;
revoke execute on function public.creer_profil() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.creer_profil();

create function public.maj_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger demandes_updated_at
  before update on public.demandes
  for each row execute function public.maj_updated_at();

-- ---------- Droits (on part de zéro et on n'ouvre que le nécessaire) ----------

revoke all on public.profiles, public.espaces, public.services, public.intervenants,
  public.intervenant_services, public.demandes, public.demande_refus, public.avis
  from anon, authenticated;

-- Espaces et services : visibles par tous, modifiables par les admins.
grant select on public.espaces, public.services to anon, authenticated;
grant insert, update, delete on public.espaces, public.services to authenticated;

-- Profils : on ne peut pas se donner soi-même les droits admin.
grant select on public.profiles to authenticated;
grant update (prenom, nom, telephone) on public.profiles to authenticated;

-- Intervenants : on ne peut pas se valider soi-même.
grant select on public.intervenants to authenticated;
grant insert (id, espace_id, type, position, rayon_km) on public.intervenants to authenticated;
grant update (disponible, position, rayon_km) on public.intervenants to authenticated;

grant select, insert, delete on public.intervenant_services to authenticated;

-- Demandes : le statut et l'intervenant seront changés par des fonctions
-- dédiées (étapes 7 et 8), jamais directement.
grant select on public.demandes to authenticated;
grant insert (demandeur_id, service_id, position, adresse, message) on public.demandes to authenticated;

grant select on public.demande_refus to authenticated;

grant select on public.avis to authenticated;
grant insert (demande_id, note, commentaire) on public.avis to authenticated;

-- ---------- Sécurité ligne par ligne (RLS) ----------

alter table public.profiles enable row level security;
alter table public.espaces enable row level security;
alter table public.services enable row level security;
alter table public.intervenants enable row level security;
alter table public.intervenant_services enable row level security;
alter table public.demandes enable row level security;
alter table public.demande_refus enable row level security;
alter table public.avis enable row level security;

-- profiles
create policy "Voir son profil, ceux liés à ses demandes, ou tout si admin"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.est_admin())
    or exists (
      select 1 from public.demandes d
      where (d.demandeur_id = profiles.id and d.intervenant_id = (select auth.uid()))
         or (d.intervenant_id = profiles.id and d.demandeur_id = (select auth.uid()))
    )
  );

create policy "Modifier son propre profil"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- espaces
create policy "Espaces visibles par tous"
  on public.espaces for select to anon, authenticated
  using (true);

create policy "Admins : ajouter des espaces"
  on public.espaces for insert to authenticated
  with check ((select public.est_admin()));

create policy "Admins : modifier les espaces"
  on public.espaces for update to authenticated
  using ((select public.est_admin()))
  with check ((select public.est_admin()));

create policy "Admins : supprimer des espaces"
  on public.espaces for delete to authenticated
  using ((select public.est_admin()));

-- services
create policy "Services visibles par tous"
  on public.services for select to anon, authenticated
  using (true);

create policy "Admins : ajouter des services"
  on public.services for insert to authenticated
  with check ((select public.est_admin()));

create policy "Admins : modifier les services"
  on public.services for update to authenticated
  using ((select public.est_admin()))
  with check ((select public.est_admin()));

create policy "Admins : supprimer des services"
  on public.services for delete to authenticated
  using ((select public.est_admin()));

-- intervenants
create policy "Voir sa fiche intervenant (ou tout si admin)"
  on public.intervenants for select to authenticated
  using (id = (select auth.uid()) or (select public.est_admin()));

create policy "Devenir intervenant pour soi-même"
  on public.intervenants for insert to authenticated
  with check (id = (select auth.uid()));

create policy "Modifier sa fiche intervenant"
  on public.intervenants for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- intervenant_services
create policy "Voir ses services (ou tout si admin)"
  on public.intervenant_services for select to authenticated
  using (intervenant_id = (select auth.uid()) or (select public.est_admin()));

create policy "Ajouter un service de son espace"
  on public.intervenant_services for insert to authenticated
  with check (
    intervenant_id = (select auth.uid())
    and exists (
      select 1
      from public.services s
      join public.intervenants i on i.espace_id = s.espace_id
      where s.id = service_id and i.id = (select auth.uid())
    )
  );

create policy "Retirer un de ses services"
  on public.intervenant_services for delete to authenticated
  using (intervenant_id = (select auth.uid()));

-- demandes
create policy "Voir ses demandes (faites ou reçues), ou tout si admin"
  on public.demandes for select to authenticated
  using (
    demandeur_id = (select auth.uid())
    or intervenant_id = (select auth.uid())
    or (select public.est_admin())
  );

create policy "Faire une demande pour soi-même"
  on public.demandes for insert to authenticated
  with check (demandeur_id = (select auth.uid()));

-- demande_refus
create policy "Voir ses refus (ou tout si admin)"
  on public.demande_refus for select to authenticated
  using (intervenant_id = (select auth.uid()) or (select public.est_admin()));

-- avis
create policy "Voir les avis de ses demandes (ou tout si admin)"
  on public.avis for select to authenticated
  using (
    (select public.est_admin())
    or exists (
      select 1 from public.demandes d
      where d.id = demande_id
        and (d.demandeur_id = (select auth.uid()) or d.intervenant_id = (select auth.uid()))
    )
  );

create policy "Laisser un avis sur sa demande terminée"
  on public.avis for insert to authenticated
  with check (
    exists (
      select 1 from public.demandes d
      where d.id = demande_id
        and d.demandeur_id = (select auth.uid())
        and d.statut = 'terminee'
    )
  );

-- ---------- Données de départ ----------

insert into public.espaces (slug, nom, description, ordre) values
  ('bahourim', 'Bahourim', 'Les bahourim viennent vous aider, par exemple pour mettre les téfilines.', 1),
  ('equipe-feminine', 'Équipe féminine', 'Les femmes de l''équipe viennent faire les ''hallot avec vous ou vous les apportent.', 2),
  ('sofer-rav-rabbanit', 'Sofer / Rav / Rabbanit', 'Cachérisation, vérification ou fourniture de téfilines, questions de halakha.', 3),
  ('chaliah', 'Chaliah', 'Éduquer sans imposer : cours, accompagnement et orientation progressive vers la Torah.', 4);

insert into public.services (espace_id, nom, ordre)
select e.id, s.nom, s.ordre
from (values
  ('bahourim', 'Mettre les téfilines', 1),
  ('bahourim', 'Loulav et étrog', 2),
  ('bahourim', 'Écouter le chofar', 3),
  ('equipe-feminine', '''Hallot pour Chabbat', 1),
  ('equipe-feminine', 'Bougies de Chabbat', 2),
  ('equipe-feminine', 'Accompagnement', 3),
  ('sofer-rav-rabbanit', 'Cachériser un four', 1),
  ('sofer-rav-rabbanit', 'Vérifier des téfilines', 2),
  ('sofer-rav-rabbanit', 'Fournir des téfilines', 3),
  ('sofer-rav-rabbanit', 'Question de halakha', 4),
  ('chaliah', 'Cours de Torah', 1),
  ('chaliah', 'Accompagnement', 2),
  ('chaliah', 'Orientation', 3)
) as s (slug, nom, ordre)
join public.espaces e on e.slug = s.slug;
