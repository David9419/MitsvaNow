-- =====================================================================
-- Vérification des comptes (sécurité)
--
-- Chaque nouveau compte (demandeur ou intervenant) commence « en_attente ».
-- Tant qu'un administrateur ne l'a pas validé (après avoir appelé la personne
-- et vérifié sa communauté / son référent), il ne peut rien faire de privé :
-- pas de demande, pas de réception de demandes, pas de disponibilité.
-- La vérification est faite côté base : on ne peut pas la contourner en
-- appelant directement l'API ou en changeant une adresse dans le navigateur.
-- =====================================================================

-- 1. Statut de vérification dans le profil (colonne NON modifiable par l'utilisateur :
--    seuls prenom, nom, telephone sont ouverts en écriture)
alter table public.profiles
  add column if not exists verification public.statut_validation not null default 'en_attente',
  add column if not exists communaute text,
  add column if not exists referent text,
  add column if not exists verifie_le timestamptz,
  add column if not exists verifie_par uuid references public.profiles (id) on delete set null,
  add column if not exists motif_verification text;

-- Les comptes déjà inscrits avant cette mise à jour restent actifs
-- (l'administrateur peut les revoir et les suspendre dans la page Administration).
update public.profiles
set verification = 'valide',
    verifie_le = now(),
    motif_verification = 'Compte créé avant la mise en place de la vérification'
where verification = 'en_attente' and verifie_le is null and created_at < now();

-- Un nouvel intervenant n'est plus validé d'office
alter table public.intervenants alter column validation set default 'en_attente';

create index if not exists profiles_verification_idx on public.profiles (verification);

-- 2. Journal des décisions (qui a validé / refusé / suspendu qui, et pourquoi)
create table if not exists public.journal_verifications (
  id bigint generated always as identity primary key,
  utilisateur_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid references public.profiles (id) on delete set null,
  ancien public.statut_validation,
  nouveau public.statut_validation not null,
  motif text,
  created_at timestamptz not null default now()
);
alter table public.journal_verifications enable row level security;
create policy "Admins : voir le journal des vérifications"
  on public.journal_verifications for select to authenticated
  using ((select public.est_admin()));

-- 3. Outils de vérification
-- Vrai si la personne connectée a un compte validé
create or replace function public.compte_valide()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.verification = 'valide' from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;
grant execute on function public.compte_valide() to authenticated;

-- Arrête l'action si le compte n'est pas validé
create or replace function prive.exiger_compte_valide()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v public.statut_validation;
begin
  if auth.uid() is null then
    raise exception 'Vous devez être connecté.';
  end if;
  select verification into v from public.profiles where id = auth.uid();
  if v is null or v = 'en_attente' then
    raise exception 'Votre compte est en cours de vérification.';
  elsif v <> 'valide' then
    raise exception 'Votre compte n''est pas autorisé à utiliser ce service.';
  end if;
end;
$$;

-- 4. Garde ajoutée au début de chaque action privée appelée par le site
do $$
declare
  f text;
  def text;
begin
  foreach f in array array[
    'public.creer_demande(uuid,double precision,double precision,text,text,text,timestamp with time zone)',
    'public.repondre_demande(uuid,boolean,text,integer)',
    'public.confirmer_intervenant(uuid,boolean)',
    'public.avancer_demande(uuid)',
    'public.annuler_intervention(uuid,text)',
    'public.mettre_a_jour_intervenant(boolean,double precision,double precision,numeric,text)'
  ] loop
    def := pg_get_functiondef(f::regprocedure);
    if position('prive.exiger_compte_valide()' in def) = 0 then
      def := regexp_replace(def, E'\nbegin\n', E'\nbegin\n  perform prive.exiger_compte_valide();\n');
      execute def;
    end if;
  end loop;
end;
$$;

-- 5. Seuls les intervenants VALIDÉS reçoivent des demandes
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
  );
$$;

-- 6. Fermer les portes « directes » de l'API
-- Personne ne peut se déclarer intervenant tout seul (seulement à l'inscription, puis validation)
alter policy "Devenir intervenant pour soi-même" on public.intervenants
  with check (false);
-- Modifier sa fiche intervenant (disponibilité, rayon…) : seulement si le compte est validé
alter policy "Modifier sa fiche intervenant" on public.intervenants
  using (id = (select auth.uid()) and (select public.compte_valide()))
  with check (id = (select auth.uid()) and (select public.compte_valide()));
-- Les demandes passent toutes par creer_demande (contrôles + diffusion)
alter policy "Faire une demande pour soi-même" on public.demandes
  with check (false);

-- 7. Un nom vérifié ne se change plus sans un administrateur
create or replace function prive.proteger_profil()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Les fonctions internes (propriétaire postgres) ne sont pas concernées
  if current_user in ('authenticated', 'anon')
     and old.verification = 'valide'
     and (new.prenom is distinct from old.prenom or new.nom is distinct from old.nom)
     and not public.est_admin() then
    raise exception 'Votre nom a été vérifié : pour le changer, contactez un administrateur.';
  end if;
  return new;
end;
$$;
create or replace trigger profils_proteger
  before update on public.profiles
  for each row execute function prive.proteger_profil();

-- 8. Inscription : on garde la communauté et le référent ; le compte commence « en_attente »
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
  v_langue text := coalesce(v_meta ->> 'langue', 'fr');
begin
  v_intervenant := v_espace_slug is not null and v_type is not null and (
    (v_espace_slug = 'bahourim' and v_type = 'bahour')
    or (v_espace_slug = 'equipe-feminine' and v_type = 'femme')
    or (v_espace_slug = 'sofer-rav-rabbanit' and v_type in ('sofer', 'rav', 'rabbanit'))
    or (v_espace_slug = 'chaliah' and v_type = 'chaliah')
  );
  if v_langue not in ('fr', 'he', 'en') then v_langue := 'fr'; end if;

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

  -- verification : toujours « en_attente » (valeur par défaut, jamais lue dans les données envoyées)
  insert into public.profiles (id, prenom, nom, telephone, email, espace_id, position, adresse, langue,
                               communaute, referent)
  values (
    new.id,
    left(coalesce(v_meta ->> 'prenom', ''), 80),
    left(coalesce(v_meta ->> 'nom', ''), 80),
    left(v_meta ->> 'telephone', 20),
    new.email,
    v_espace_id,
    v_position,
    v_adresse,
    v_langue,
    left(nullif(btrim(v_meta ->> 'communaute'), ''), 200),
    left(nullif(btrim(v_meta ->> 'referent'), ''), 200)
  );

  if v_intervenant and v_espace_id is not null then
    insert into public.intervenants (id, espace_id, type, position, adresse, validation)
    values (new.id, v_espace_id, v_type::public.type_intervenant, v_position, v_adresse, 'en_attente');
  end if;

  return new;
end;
$$;

-- 9. « Mot de passe oublié » : on ne dit plus si une adresse est inscrite
--    (sinon n'importe qui pourrait savoir qui fait partie de la communauté)
create or replace function public.email_inscrit(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select null::boolean;
$$;

-- 10. Administration
-- Mon statut (pour la page « compte en cours de vérification »)
create or replace function public.mon_statut_compte()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'verification', p.verification,
    'motif', case when p.verification in ('refuse', 'suspendu') then p.motif_verification end,
    'telephone', p.telephone,
    'est_admin', p.est_admin
  )
  from public.profiles p
  where p.id = (select auth.uid());
$$;
grant execute on function public.mon_statut_compte() to authenticated;

-- Tous les comptes, pour les administrateurs
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
        (p.verification = 'valide' and p.verifie_par is null) as valide_automatiquement,
        nullif(btrim(concat_ws(' ', v.prenom, v.nom)), '') as verifie_par_nom,
        e.slug as espace_slug,
        i.type as type_intervenant,
        case p.verification when 'en_attente' then 0 else 1 end as ordre
      from public.profiles p
      left join public.espaces e on e.id = p.espace_id
      left join public.intervenants i on i.id = p.id
      left join public.profiles v on v.id = p.verifie_par
    ) x
  ), '[]'::jsonb);
end;
$$;
grant execute on function public.admin_comptes() to authenticated;

-- Valider, refuser, suspendre ou remettre en attente un compte
create or replace function public.admin_decider(p_utilisateur uuid, p_decision text, p_motif text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := auth.uid();
  v_ancien public.statut_validation;
  v_cible_admin boolean;
  v_decision public.statut_validation;
  v_motif text := left(nullif(btrim(p_motif), ''), 300);
  v_d record;
begin
  if not public.est_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;
  if p_decision not in ('valide', 'refuse', 'suspendu', 'en_attente') then
    raise exception 'Décision inconnue.';
  end if;
  v_decision := p_decision::public.statut_validation;
  if p_utilisateur = v_admin then
    raise exception 'Vous ne pouvez pas changer votre propre compte.';
  end if;

  select verification, est_admin into v_ancien, v_cible_admin
  from public.profiles where id = p_utilisateur for update;
  if v_ancien is null then
    raise exception 'Compte introuvable.';
  end if;
  if v_cible_admin then
    raise exception 'Ce compte est celui d''un administrateur.';
  end if;
  if v_decision in ('refuse', 'suspendu') and v_motif is null then
    raise exception 'Indiquez le motif de la décision.';
  end if;

  update public.profiles
  set verification = v_decision,
      verifie_le = now(),
      verifie_par = v_admin,
      motif_verification = v_motif
  where id = p_utilisateur;

  update public.intervenants
  set validation = v_decision,
      disponible = case when v_decision = 'valide' then disponible else false end
  where id = p_utilisateur;

  if v_decision <> 'valide' then
    -- Il ne reçoit plus aucune demande
    update public.demande_propositions set active = false
    where intervenant_id = p_utilisateur and active;

    -- Ses interventions en cours repartent chez les autres intervenants
    for v_d in
      select id from public.demandes
      where intervenant_id = p_utilisateur and statut in ('acceptee', 'en_cours')
    loop
      insert into public.demande_refus (demande_id, intervenant_id)
      values (v_d.id, p_utilisateur) on conflict do nothing;
      update public.demandes
      set statut = 'en_attente', intervenant_id = null, transport = null, eta_minutes = null,
          acceptee_le = null, confirmee = false, recherche_depuis = now(),
          annulee_par = 'intervenant', motif_annulation = 'L''intervenant n''est plus disponible.'
      where id = v_d.id;
      perform public.attribuer_demande(v_d.id);
    end loop;

    -- Ses propres demandes ouvertes sont arrêtées
    update public.demandes
    set statut = 'annulee', annulee_par = 'systeme', motif_annulation = null
    where demandeur_id = p_utilisateur and statut in ('en_attente', 'acceptee', 'en_cours');
  end if;

  insert into public.journal_verifications (utilisateur_id, admin_id, ancien, nouveau, motif)
  values (p_utilisateur, v_admin, v_ancien, v_decision, v_motif);
end;
$$;
grant execute on function public.admin_decider(uuid, text, text) to authenticated;
