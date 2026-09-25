-- « Mot de passe oublié » : savoir si un compte existe avec cet e-mail,
-- pour dire clairement « aucun compte » au lieu de faire croire qu'un e-mail est parti.
-- (L'inscription indique déjà « un compte existe déjà » : rien de plus n'est dévoilé.)
create or replace function public.email_inscrit(p_email text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users where lower(email) = lower(trim(p_email)));
$$;

revoke execute on function public.email_inscrit(text) from public;
grant execute on function public.email_inscrit(text) to anon, authenticated;
