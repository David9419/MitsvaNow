-- =====================================================================
-- Profils : e-mail + espace (5 espaces)
--  - nouvel espace « Demandeurs » dans la table espaces
--  - profiles.email : copié automatiquement depuis le compte (et tenu à jour)
--  - profiles.espace_id : l'espace choisi à l'inscription (1 des 5)
--  - les comptes existants sont complétés
--  - sécurité : on ne voit le profil de l'autre personne d'une demande
--    qu'une fois la demande acceptée
-- =====================================================================

-- ---------- 5e espace ----------
insert into public.espaces (slug, nom, description, ordre)
values ('demandeurs', 'Demandeurs', 'Les personnes qui ont un besoin et font une demande.', 0)
on conflict (slug) do nothing;

-- ---------- Nouvelles colonnes ----------
alter table public.profiles
  add column email text,
  add column espace_id uuid references public.espaces (id);
create index profiles_espace_id_idx on public.profiles (espace_id);

-- ---------- Compléter les comptes existants ----------
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

update public.profiles p
set espace_id = coalesce(
  (select i.espace_id from public.intervenants i where i.id = p.id),
  (select e.id from public.espaces e where e.slug = 'demandeurs')
);

-- ---------- Inscription : e-mail + espace enregistrés ----------
create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_espace_slug text := new.raw_user_meta_data ->> 'espace';
  v_type text := new.raw_user_meta_data ->> 'type_intervenant';
  v_espace_id uuid;
  v_intervenant boolean;
begin
  v_intervenant := v_espace_slug is not null and v_type is not null and (
    (v_espace_slug = 'bahourim' and v_type = 'bahour')
    or (v_espace_slug = 'equipe-feminine' and v_type = 'femme')
    or (v_espace_slug = 'sofer-rav-rabbanit' and v_type in ('sofer', 'rav', 'rabbanit'))
    or (v_espace_slug = 'chaliah' and v_type = 'chaliah')
  );

  -- Espace du profil : celui de l'intervenant, sinon « Demandeurs »
  select e.id into v_espace_id
  from public.espaces e
  where e.slug = case when v_intervenant then v_espace_slug else 'demandeurs' end;

  insert into public.profiles (id, prenom, nom, telephone, email, espace_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'prenom', ''),
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    new.raw_user_meta_data ->> 'telephone',
    new.email,
    v_espace_id
  );

  if v_intervenant and v_espace_id is not null then
    insert into public.intervenants (id, espace_id, type)
    values (new.id, v_espace_id, v_type::public.type_intervenant);
  end if;

  return new;
end;
$$;
revoke execute on function public.creer_profil() from public, anon, authenticated;

-- ---------- Si l'e-mail du compte change, le profil suit ----------
create function public.synchroniser_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
revoke execute on function public.synchroniser_email() from public, anon, authenticated;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.synchroniser_email();

-- ---------- Sécurité : profil de l'autre visible seulement après acceptation ----------
drop policy "Voir son profil, ceux liés à ses demandes, ou tout si admin" on public.profiles;
create policy "Voir son profil, ceux liés à ses demandes acceptées, ou tout si admin"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.est_admin())
    or exists (
      select 1 from public.demandes d
      where d.statut in ('acceptee', 'en_cours', 'terminee')
        and (
          (d.demandeur_id = profiles.id and d.intervenant_id = (select auth.uid()))
          or (d.intervenant_id = profiles.id and d.demandeur_id = (select auth.uid()))
        )
    )
  );
