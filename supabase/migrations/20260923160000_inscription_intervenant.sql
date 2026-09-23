-- =====================================================================
-- Inscription : si la personne choisit « devenir intervenant », on crée
-- automatiquement sa fiche intervenant (toujours « en attente » de
-- validation par un administrateur).
-- Informations lues dans les données d'inscription :
--   espace            : slug de l'espace (bahourim, equipe-feminine…)
--   type_intervenant  : bahour, femme, sofer, rav, rabbanit, chaliah
-- Le type doit correspondre à l'espace, sinon rien n'est créé.
-- =====================================================================

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
begin
  insert into public.profiles (id, prenom, nom, telephone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'prenom', ''),
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    new.raw_user_meta_data ->> 'telephone'
  );

  if v_espace_slug is not null and v_type is not null
     and (
       (v_espace_slug = 'bahourim' and v_type = 'bahour')
       or (v_espace_slug = 'equipe-feminine' and v_type = 'femme')
       or (v_espace_slug = 'sofer-rav-rabbanit' and v_type in ('sofer', 'rav', 'rabbanit'))
       or (v_espace_slug = 'chaliah' and v_type = 'chaliah')
     )
  then
    select e.id into v_espace_id from public.espaces e where e.slug = v_espace_slug;
    if v_espace_id is not null then
      insert into public.intervenants (id, espace_id, type)
      values (new.id, v_espace_id, v_type::public.type_intervenant);
    end if;
  end if;

  return new;
end;
$$;
revoke execute on function public.creer_profil() from public, anon, authenticated;
