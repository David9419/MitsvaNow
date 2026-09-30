-- =====================================================================
-- Grande mise à jour (septembre 2026)
--  1. « Bahourim » devient « Bahourim / Hassidim »
--  2. 16 nouveaux services (8 par espace) + noms en hébreu et en anglais
--  3. Photo de profil (stockage « photos ») et langue de chaque personne
--  4. Demandes programmées (jour + heure)
--  5. Acceptation : moyen de transport + délai d'arrivée ; le demandeur confirme
--     ou refuse l'intervenant (refus = on cherche le suivant)
--  6. Annulation avec motif, par le demandeur ou par l'intervenant
--  7. Délai automatique : sans réponse, la demande passe au suivant, puis expire
--  8. Avis : moyenne, nombre et liste pour chaque intervenant
--  9. Notifications : un seul déclencheur, textes dans la langue de chacun
-- =====================================================================

-- ---------- 1. Nom de l'espace ----------
update public.espaces
set nom = 'Bahourim / Hassidim',
    description = 'Téfilines, mezouza, tsédaka, livres, minyan, étude, visites, kiddouch : le bahour / hassid le plus proche vient vous voir.'
where slug = 'bahourim';

update public.espaces set description = case slug
  when 'equipe-feminine' then '''Hallot, Chabbat, cours, visites, rendez-vous, courses, écoute et soutien : une femme de l''équipe vient vous aider.'
  when 'sofer-rav-rabbanit' then 'Cacheroute, bérakhot, questions, mariages, téfilines et mezouzot, éducation, brit mila, cours de Torah.'
  when 'chaliah' then 'Éducation juive, bar-mitsva, paracha, visites, séoudot et cours, collectes, calendriers, minyan.'
  else description end;

-- ---------- 2. Services ----------
alter table public.services
  add column if not exists nom_he text,
  add column if not exists nom_en text;

insert into public.services (espace_id, nom, ordre, actif)
select e.id, n.nom, n.ordre, true
from (values
  ('bahourim', 'Compléter un minyan', 5),
  ('bahourim', 'Étude / חברותא', 6),
  ('bahourim', 'Visite à une personne seule', 7),
  ('bahourim', 'Aide pour préparer un kiddouch', 8),
  ('equipe-feminine', 'Visite à une personne seule', 5),
  ('equipe-feminine', 'Accompagner à un rendez-vous', 6),
  ('equipe-feminine', 'Faire les courses pour quelqu''un', 7),
  ('equipe-feminine', 'Écoute et soutien', 8),
  ('sofer-rav-rabbanit', 'Vérification des téfilines / mezouzot', 5),
  ('sofer-rav-rabbanit', 'Conseil pour l''éducation des enfants', 6),
  ('sofer-rav-rabbanit', 'Brit mila', 7),
  ('sofer-rav-rabbanit', 'Cours de Torah', 8),
  ('chaliah', 'Organiser une séouda / un cours', 5),
  ('chaliah', 'Collecte pour une famille', 6),
  ('chaliah', 'Distribution de calendriers juifs', 7),
  ('chaliah', 'Créer un minyan', 8)
) as n (slug, nom, ordre)
join public.espaces e on e.slug = n.slug
on conflict (espace_id, nom) do update set ordre = excluded.ordre, actif = true;

update public.services s
set nom_he = t.he, nom_en = t.en
from (values
  ('bahourim', 'Mettre les téfilines', 'הנחת תפילין', 'Putting on tefillin'),
  ('bahourim', 'Installation de mezouza', 'קביעת מזוזה', 'Mezuzah installation'),
  ('bahourim', 'Remise d''une boîte de tsédaka', 'מסירת קופת צדקה', 'Tzedakah box delivery'),
  ('bahourim', 'Livraison de Sefer / livre / siddour', 'משלוח ספר / סידור', 'Sefer / book / siddur delivery'),
  ('bahourim', 'Compléter un minyan', 'השלמת מניין', 'Completing a minyan'),
  ('bahourim', 'Étude / חברותא', 'לימוד / חברותא', 'Study / Chavruta'),
  ('bahourim', 'Visite à une personne seule', 'ביקור אצל אדם בודד', 'Visiting someone who is alone'),
  ('bahourim', 'Aide pour préparer un kiddouch', 'עזרה בהכנת קידוש', 'Help preparing a kiddush'),
  ('equipe-feminine', '''Hallot pour Chabbat', 'חלות לשבת', 'Challah for Shabbat'),
  ('equipe-feminine', 'Remise de bougies et horaires de Chabbat', 'נרות וזמני שבת', 'Shabbat candles and times'),
  ('equipe-feminine', 'Apprendre le judaïsme / cours de Torah', 'לימוד יהדות / שיעור תורה', 'Learning Judaism / Torah class'),
  ('equipe-feminine', 'Aider à préparer Chabbat', 'עזרה בהכנות לשבת', 'Help preparing Shabbat'),
  ('equipe-feminine', 'Visite à une personne seule', 'ביקור אצל אדם בודד', 'Visiting someone who is alone'),
  ('equipe-feminine', 'Accompagner à un rendez-vous', 'ליווי לפגישה', 'Accompanying to an appointment'),
  ('equipe-feminine', 'Faire les courses pour quelqu''un', 'קניות עבור מישהו', 'Grocery shopping for someone'),
  ('equipe-feminine', 'Écoute et soutien', 'הקשבה ותמיכה', 'Listening and support'),
  ('sofer-rav-rabbanit', 'Vérification de la cacheroute', 'בדיקת כשרות', 'Kashrut check'),
  ('sofer-rav-rabbanit', 'Bérakhot ou aide dans une situation délicate', 'ברכות או עזרה במצב רגיש', 'Blessings or help in a difficult situation'),
  ('sofer-rav-rabbanit', 'Question et accompagnement', 'שאלה וליווי', 'Questions and guidance'),
  ('sofer-rav-rabbanit', 'Célébrer un mariage', 'עריכת חופה', 'Officiating a wedding'),
  ('sofer-rav-rabbanit', 'Vérification des téfilines / mezouzot', 'בדיקת תפילין / מזוזות', 'Tefillin / mezuzah check'),
  ('sofer-rav-rabbanit', 'Conseil pour l''éducation des enfants', 'ייעוץ בחינוך ילדים', 'Advice on raising children'),
  ('sofer-rav-rabbanit', 'Brit mila', 'ברית מילה', 'Brit milah'),
  ('sofer-rav-rabbanit', 'Cours de Torah', 'שיעור תורה', 'Torah class'),
  ('chaliah', 'Éducation juive', 'חינוך יהודי', 'Jewish education'),
  ('chaliah', 'Préparation à la bar-mitsva', 'הכנה לבר מצווה', 'Bar mitzvah preparation'),
  ('chaliah', 'Apprendre la paracha', 'לימוד פרשת השבוע', 'Learning the parasha'),
  ('chaliah', 'Visite aux personnes dans le besoin', 'ביקור אצל נזקקים', 'Visiting people in need'),
  ('chaliah', 'Organiser une séouda / un cours', 'ארגון סעודה / שיעור', 'Organizing a seudah / class'),
  ('chaliah', 'Collecte pour une famille', 'מגבית למשפחה', 'Fundraising for a family'),
  ('chaliah', 'Distribution de calendriers juifs', 'חלוקת לוחות שנה יהודיים', 'Jewish calendar distribution'),
  ('chaliah', 'Créer un minyan', 'הקמת מניין', 'Starting a minyan')
) as t (slug, nom, he, en)
join public.espaces e on e.slug = t.slug
where s.espace_id = e.id and s.nom = t.nom;

-- Noms d'un service dans les 3 langues
create or replace function public.noms_service(s public.services)
returns json language sql immutable set search_path = '' as $$
  select json_build_object('fr', s.nom, 'he', coalesce(s.nom_he, s.nom), 'en', coalesce(s.nom_en, s.nom));
$$;

-- ---------- 3. Photo et langue ----------
alter table public.profiles
  add column if not exists photo_url text,
  add column if not exists langue text not null default 'fr' check (langue in ('fr', 'he', 'en'));

-- Les photos sont rangées dans « photos/<id de la personne>/… » (lecture publique)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Photos : voir les siennes" on storage.objects;
drop policy if exists "Photos : ajouter les siennes" on storage.objects;
drop policy if exists "Photos : modifier les siennes" on storage.objects;
drop policy if exists "Photos : supprimer les siennes" on storage.objects;

create policy "Photos : voir les siennes" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Photos : ajouter les siennes" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Photos : modifier les siennes" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Photos : supprimer les siennes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Enregistre l'adresse de sa photo (seulement une photo de son propre dossier)
create or replace function public.definir_photo(p_url text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Vous devez être connecté.'; end if;
  if p_url is not null and p_url not like
    'https://otwsxjchgbwporwldrkw.supabase.co/storage/v1/object/public/photos/' || auth.uid()::text || '/%' then
    raise exception 'Photo invalide.';
  end if;
  update public.profiles set photo_url = p_url where id = auth.uid();
end $$;

create or replace function public.definir_langue(p_langue text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return; end if;
  if p_langue not in ('fr', 'he', 'en') then raise exception 'Langue inconnue.'; end if;
  update public.profiles set langue = p_langue where id = auth.uid();
end $$;

revoke execute on function public.definir_photo(text) from public, anon;
revoke execute on function public.definir_langue(text) from public, anon;
grant execute on function public.definir_photo(text) to authenticated;
grant execute on function public.definir_langue(text) to authenticated;

-- La langue choisie au moment de l'inscription est gardée dans le profil
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

  insert into public.profiles (id, prenom, nom, telephone, email, espace_id, position, adresse, langue)
  values (
    new.id,
    coalesce(v_meta ->> 'prenom', ''),
    coalesce(v_meta ->> 'nom', ''),
    v_meta ->> 'telephone',
    new.email,
    v_espace_id,
    v_position,
    v_adresse,
    v_langue
  );

  if v_intervenant and v_espace_id is not null then
    insert into public.intervenants (id, espace_id, type, position, adresse)
    values (new.id, v_espace_id, v_type::public.type_intervenant, v_position, v_adresse);
  end if;

  return new;
end;
$$;

-- ---------- 4 à 7. Nouvelles informations sur les demandes ----------
alter table public.demandes
  add column if not exists programmee_pour timestamptz,
  add column if not exists transport text check (transport in ('a_pied', 'trottinette', 'velo', 'voiture', 'transports')),
  add column if not exists eta_minutes smallint check (eta_minutes between 1 and 720),
  add column if not exists acceptee_le timestamptz,
  add column if not exists confirmee boolean not null default false,
  add column if not exists annulee_par text check (annulee_par in ('demandeur', 'intervenant', 'systeme')),
  add column if not exists motif_annulation text,
  add column if not exists recherche_depuis timestamptz not null default now(),
  add column if not exists attribuee_le timestamptz;

-- Les demandes déjà acceptées avant cette mise à jour sont considérées comme confirmées
update public.demandes set confirmee = true where statut in ('acceptee', 'en_cours', 'terminee');
update public.demandes set attribuee_le = updated_at where intervenant_id is not null and attribuee_le is null;

create index if not exists demandes_statut_idx on public.demandes (statut);

-- Attribution : on retient aussi le moment où la demande est proposée
create or replace function public.attribuer_demande(p_demande uuid)
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
    and (
      not exists (select 1 from public.intervenant_services x where x.intervenant_id = i.id)
      or exists (
        select 1 from public.intervenant_services x
        where x.intervenant_id = i.id and x.service_id = v_d.service_id
      )
    )
    and not exists (
      select 1 from public.demande_refus r
      where r.demande_id = v_d.id and r.intervenant_id = i.id
    )
  order by extensions.st_distance(i.position, v_d.position)
  limit 1;

  update public.demandes
  set intervenant_id = v_intervenant,
      attribuee_le = case when v_intervenant is null then null else now() end
  where id = v_d.id;
  return v_intervenant;
end;
$$;
revoke execute on function public.attribuer_demande(uuid) from public, anon, authenticated;

-- Demandeur : créer une demande (tout de suite, ou programmée pour plus tard)
drop function if exists public.creer_demande(uuid, double precision, double precision, text, text, text);
create function public.creer_demande(
  p_service uuid,
  p_lat double precision,
  p_lng double precision,
  p_telephone text,
  p_adresse text default null,
  p_message text default null,
  p_programmee_pour timestamptz default null
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
  if p_programmee_pour is not null and (
    p_programmee_pour < now() + interval '10 minutes' or p_programmee_pour > now() + interval '90 days'
  ) then
    raise exception 'Date de programmation invalide.';
  end if;
  if p_programmee_pour is null and (select count(*) from public.demandes
      where demandeur_id = v_uid and programmee_pour is null
        and statut in ('en_attente', 'acceptee', 'en_cours')) >= 3 then
    raise exception 'Vous avez déjà 3 demandes en cours.';
  end if;
  if p_programmee_pour is not null and (select count(*) from public.demandes
      where demandeur_id = v_uid and programmee_pour is not null
        and statut in ('en_attente', 'acceptee', 'en_cours')) >= 10 then
    raise exception 'Vous avez déjà 10 demandes programmées.';
  end if;

  insert into public.demandes (demandeur_id, service_id, position, adresse, message, telephone, programmee_pour)
  values (v_uid, p_service, public.point_gps(p_lat, p_lng), left(p_adresse, 300), left(p_message, 1000),
          v_telephone, p_programmee_pour)
  returning id into v_id;

  perform public.attribuer_demande(v_id);
  return v_id;
end;
$$;
revoke execute on function public.creer_demande(uuid, double precision, double precision, text, text, text, timestamptz) from public, anon;
grant execute on function public.creer_demande(uuid, double precision, double precision, text, text, text, timestamptz) to authenticated;

-- Intervenant : accepter (avec transport + délai d'arrivée) ou refuser
drop function if exists public.repondre_demande(uuid, boolean);
create function public.repondre_demande(
  p_demande uuid,
  p_accepter boolean,
  p_transport text default null,
  p_eta_minutes integer default null
)
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
    if p_transport is not null and p_transport not in ('a_pied', 'trottinette', 'velo', 'voiture', 'transports') then
      raise exception 'Moyen de transport inconnu.';
    end if;
    if p_eta_minutes is not null and p_eta_minutes not between 1 and 720 then
      raise exception 'Délai d''arrivée invalide.';
    end if;
    update public.demandes
    set statut = 'acceptee', transport = p_transport, eta_minutes = p_eta_minutes,
        acceptee_le = now(), confirmee = false
    where id = p_demande;
  else
    insert into public.demande_refus (demande_id, intervenant_id)
    values (p_demande, v_uid) on conflict do nothing;
    update public.demandes set intervenant_id = null where id = p_demande;
    perform public.attribuer_demande(p_demande);
  end if;
end;
$$;
revoke execute on function public.repondre_demande(uuid, boolean, text, integer) from public, anon;
grant execute on function public.repondre_demande(uuid, boolean, text, integer) to authenticated;

-- Demandeur : confirmer l'intervenant qui a accepté, ou le refuser (on cherche le suivant)
create or replace function public.confirmer_intervenant(p_demande uuid, p_confirmer boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_d public.demandes;
begin
  select * into v_d from public.demandes
  where id = p_demande and demandeur_id = auth.uid() and statut = 'acceptee'
  for update;
  if v_d.id is null then
    raise exception 'Cette demande ne peut plus être confirmée.';
  end if;

  if p_confirmer then
    update public.demandes set confirmee = true where id = p_demande;
  else
    if v_d.intervenant_id is not null then
      insert into public.demande_refus (demande_id, intervenant_id)
      values (p_demande, v_d.intervenant_id) on conflict do nothing;
    end if;
    update public.demandes
    set statut = 'en_attente', intervenant_id = null, transport = null, eta_minutes = null,
        acceptee_le = null, confirmee = false, recherche_depuis = now()
    where id = p_demande;
    perform public.attribuer_demande(p_demande);
  end if;
end;
$$;
revoke execute on function public.confirmer_intervenant(uuid, boolean) from public, anon;
grant execute on function public.confirmer_intervenant(uuid, boolean) to authenticated;

-- Demandeur : annuler (avec un motif)
drop function if exists public.annuler_demande(uuid);
create function public.annuler_demande(p_demande uuid, p_motif text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.demandes
  set statut = 'annulee', annulee_par = 'demandeur', motif_annulation = left(nullif(btrim(p_motif), ''), 300)
  where id = p_demande
    and demandeur_id = auth.uid()
    and statut in ('en_attente', 'acceptee', 'en_cours');
  if not found then
    raise exception 'Cette demande ne peut plus être annulée.';
  end if;
end;
$$;
revoke execute on function public.annuler_demande(uuid, text) from public, anon;
grant execute on function public.annuler_demande(uuid, text) to authenticated;

-- Intervenant : annuler une demande acceptée (motif obligatoire)
create or replace function public.annuler_intervention(p_demande uuid, p_motif text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(btrim(p_motif), '') = '' then
    raise exception 'Indiquez le motif de l''annulation.';
  end if;
  update public.demandes
  set statut = 'annulee', annulee_par = 'intervenant', motif_annulation = left(btrim(p_motif), 300)
  where id = p_demande
    and intervenant_id = auth.uid()
    and statut in ('acceptee', 'en_cours');
  if not found then
    raise exception 'Cette demande ne peut plus être annulée.';
  end if;
end;
$$;
revoke execute on function public.annuler_intervention(uuid, text) from public, anon;
grant execute on function public.annuler_intervention(uuid, text) to authenticated;

-- Intervenant : acceptée → en route (après confirmation du demandeur) → terminée
create or replace function public.avancer_demande(p_demande uuid)
returns public.statut_demande
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_statut public.statut_demande;
begin
  if exists (
    select 1 from public.demandes
    where id = p_demande and intervenant_id = auth.uid() and statut = 'acceptee' and not confirmee
  ) then
    raise exception 'En attente de la confirmation du demandeur.';
  end if;

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

-- ---------- 7. Délai automatique (toutes les minutes) ----------
--  - sans réponse de l'intervenant : 5 min (2 h pour une demande programmée),
--    puis la demande passe au suivant ;
--  - personne n'a accepté après 15 min (ou à l'heure prévue pour une demande
--    programmée, 48 h au plus) : la demande expire et le demandeur est prévenu ;
--  - le demandeur n'a pas confirmé l'intervenant au bout de 10 min : confirmé d'office.
create or replace function public.expirer_demandes()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
begin
  update public.demandes
  set confirmee = true
  where statut = 'acceptee' and not confirmee and acceptee_le < now() - interval '10 minutes';

  for v in
    select id, intervenant_id from public.demandes
    where statut = 'en_attente'
      and intervenant_id is not null
      and attribuee_le < now() - case when programmee_pour is null then interval '5 minutes' else interval '2 hours' end
  loop
    insert into public.demande_refus (demande_id, intervenant_id)
    values (v.id, v.intervenant_id) on conflict do nothing;
    update public.demandes set intervenant_id = null where id = v.id;
    perform public.attribuer_demande(v.id);
  end loop;

  update public.demandes
  set statut = 'expiree', annulee_par = 'systeme'
  where statut = 'en_attente'
    and (
      (programmee_pour is null and recherche_depuis < now() - interval '15 minutes')
      or (programmee_pour is not null and (programmee_pour < now() or recherche_depuis < now() - interval '48 hours'))
    );
end;
$$;
revoke execute on function public.expirer_demandes() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('expirer-demandes', '* * * * *', 'select public.expirer_demandes()');

-- ---------- 9. Notifications ----------
-- Appelle la fonction « notifier-demande » (même principe qu'avant)
create or replace function public.notifier(p_demande uuid, p_evenement text, p_destinataire uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  if p_destinataire is null then return; end if;
  select decrypted_secret into v_secret
  from vault.decrypted_secrets where name = 'push_secret_declencheur';
  if v_secret is null then return; end if;

  perform net.http_post(
    url := 'https://otwsxjchgbwporwldrkw.supabase.co/functions/v1/notifier-demande',
    body := jsonb_build_object('demande', p_demande, 'evenement', p_evenement, 'destinataire', p_destinataire),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-secret', v_secret)
  );
exception when others then
  -- Une notification ratée ne doit jamais bloquer la demande
  null;
end $$;
revoke execute on function public.notifier(uuid, text, uuid) from public, anon, authenticated;

-- Un seul déclencheur décide qui prévenir, et de quoi
create or replace function public.evenements_demande() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Nouvelle demande proposée à un intervenant
  if new.intervenant_id is not null and new.statut = 'en_attente'
     and (tg_op = 'INSERT' or old.intervenant_id is distinct from new.intervenant_id) then
    perform public.notifier(new.id, 'nouvelle', new.intervenant_id);
  end if;

  if tg_op = 'UPDATE' then
    if old.statut is distinct from new.statut then
      if new.statut in ('acceptee', 'en_cours', 'terminee') then
        perform public.notifier(new.id, new.statut::text, new.demandeur_id);
      elsif new.statut = 'expiree' then
        perform public.notifier(new.id, 'expiree', new.demandeur_id);
      elsif new.statut = 'annulee' and new.annulee_par = 'intervenant' then
        perform public.notifier(new.id, 'annulee', new.demandeur_id);
      elsif new.statut = 'annulee' and new.annulee_par = 'demandeur' then
        perform public.notifier(new.id, 'annulee', new.intervenant_id);
      elsif old.statut = 'acceptee' and new.statut = 'en_attente' then
        -- Le demandeur a préféré un autre intervenant
        perform public.notifier(new.id, 'refusee', old.intervenant_id);
      end if;
    end if;
    if not old.confirmee and new.confirmee and new.statut = 'acceptee' then
      perform public.notifier(new.id, 'confirmee', new.intervenant_id);
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.evenements_demande() from public, anon, authenticated;

drop trigger if exists demandes_notification_push on public.demandes;
drop trigger if exists demandes_notification_demandeur on public.demandes;
drop trigger if exists demandes_evenements on public.demandes;
create trigger demandes_evenements
  after insert or update on public.demandes
  for each row execute function public.evenements_demande();

-- Nouvel avis : l'intervenant est prévenu
create or replace function public.evenement_avis() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.notifier(
    new.demande_id, 'avis',
    (select d.intervenant_id from public.demandes d where d.id = new.demande_id)
  );
  return new;
end $$;
revoke execute on function public.evenement_avis() from public, anon, authenticated;

drop trigger if exists avis_notification on public.avis;
create trigger avis_notification
  after insert on public.avis
  for each row execute function public.evenement_avis();

-- Tout ce qu'il faut pour écrire la notification (réservé à la fonction « notifier-demande »)
create or replace function public.infos_notification(p_demande uuid, p_destinataire uuid) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'demande', d.id,
    'statut', d.statut,
    'service', public.noms_service(s),
    'demandeur', trim(pd.prenom || ' ' || coalesce(pd.nom, '')),
    'intervenant', pi.prenom,
    'adresse', d.adresse,
    'distance_m', case when i.position is not null then round(extensions.st_distance(d.position, i.position)) end,
    'programmee_pour', d.programmee_pour,
    'transport', d.transport,
    'eta_minutes', d.eta_minutes,
    'motif', d.motif_annulation,
    'note', (select a.note from public.avis a where a.demande_id = d.id),
    'langue', coalesce(dest.langue, 'fr'),
    'abonnements', coalesce((
      select json_agg(json_build_object('endpoint', a.endpoint, 'p256dh', a.p256dh, 'auth', a.auth))
      from public.abonnements_push a where a.utilisateur_id = p_destinataire
    ), '[]'::json)
  )
  from public.demandes d
  join public.services s on s.id = d.service_id
  join public.profiles pd on pd.id = d.demandeur_id
  left join public.profiles pi on pi.id = d.intervenant_id
  left join public.intervenants i on i.id = d.intervenant_id
  left join public.profiles dest on dest.id = p_destinataire
  where d.id = p_demande;
$$;
revoke execute on function public.infos_notification(uuid, uuid) from public, anon, authenticated;
grant execute on function public.infos_notification(uuid, uuid) to service_role;

-- Langue d'une personne (notification de test)
create or replace function public.langue_de(p_utilisateur uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select langue from public.profiles where id = p_utilisateur), 'fr');
$$;
revoke execute on function public.langue_de(uuid) from public, anon, authenticated;
grant execute on function public.langue_de(uuid) to service_role;

-- ---------- Tableaux de bord ----------
create or replace function public.tableau_demandeur()
returns json
language sql
stable security definer
set search_path = ''
as $$
  select json_build_object(
    'demandes', coalesce((
      select json_agg(json_build_object(
        'id', d.id, 'statut', d.statut, 'created_at', d.created_at, 'updated_at', d.updated_at,
        'service', s.nom, 'service_noms', public.noms_service(s),
        'espace_slug', e.slug, 'espace_nom', e.nom,
        'adresse', d.adresse, 'message', d.message,
        'programmee_pour', d.programmee_pour,
        'annulee_par', d.annulee_par, 'motif_annulation', d.motif_annulation,
        'intervenant_trouve', d.intervenant_id is not null,
        'intervenant_prenom', case when d.statut in ('acceptee', 'en_cours', 'terminee') then p.prenom end,
        'intervenant_nom', case when d.statut in ('acceptee', 'en_cours', 'terminee') then p.nom end,
        'intervenant_photo', case when d.statut in ('acceptee', 'en_cours', 'terminee') then p.photo_url end,
        'intervenant_telephone', case when d.statut in ('acceptee', 'en_cours') then p.telephone end,
        'intervenant_type', case when d.statut in ('acceptee', 'en_cours', 'terminee') then i.type end,
        'transport', case when d.statut in ('acceptee', 'en_cours') then d.transport end,
        'eta_minutes', case when d.statut in ('acceptee', 'en_cours') then d.eta_minutes end,
        'acceptee_le', d.acceptee_le,
        'confirmee', d.confirmee,
        'distance_m', case when d.statut in ('acceptee', 'en_cours') and i.position is not null
                           then round(extensions.st_distance(d.position, i.position)) end,
        'intervenant_avis', case when d.statut in ('acceptee', 'en_cours') and d.intervenant_id is not null then (
          select json_build_object(
            'moyenne', round(avg(a2.note)::numeric, 1),
            'nombre', count(a2.*),
            'liste', coalesce(json_agg(json_build_object(
                'prenom', pa.prenom, 'initiale', left(coalesce(pa.nom, ''), 1),
                'note', a2.note, 'commentaire', a2.commentaire, 'created_at', a2.created_at
              ) order by a2.created_at desc) filter (where a2.id is not null), '[]'::json)
          )
          from public.avis a2
          join public.demandes d2 on d2.id = a2.demande_id
          join public.profiles pa on pa.id = d2.demandeur_id
          where d2.intervenant_id = d.intervenant_id
        ) end,
        'note', a.note,
        'commentaire', a.commentaire
      ) order by coalesce(d.programmee_pour, d.created_at) desc)
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

create or replace function public.tableau_intervenant()
returns json
language sql
stable security definer
set search_path = ''
as $$
  with moi as (
    select i.*, e.slug as espace_slug, e.nom as espace_nom
    from public.intervenants i
    join public.espaces e on e.id = i.espace_id
    where i.id = auth.uid()
  ),
  mes_demandes as (
    select d.*, s.nom as service_nom, public.noms_service(s) as service_noms,
           d.statut in ('acceptee', 'en_cours') as telephone_visible,
           d.statut in ('acceptee', 'en_cours', 'terminee') as acceptee
    from public.demandes d
    join public.services s on s.id = d.service_id
    where d.intervenant_id = auth.uid()
  ),
  mes_avis as (
    select a.*, p.prenom, p.nom, p.photo_url, s.nom as service_nom, public.noms_service(s) as service_noms
    from public.avis a
    join public.demandes d on d.id = a.demande_id
    join public.services s on s.id = d.service_id
    join public.profiles p on p.id = d.demandeur_id
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
        'service', d.service_nom, 'service_noms', d.service_noms, 'message', d.message,
        'distance_m', (select round(extensions.st_distance(d.position, m.position)) from moi m),
        'adresse', d.adresse,
        'lat', extensions.st_y(d.position::extensions.geometry),
        'lng', extensions.st_x(d.position::extensions.geometry),
        'programmee_pour', d.programmee_pour,
        'attribuee_le', d.attribuee_le,
        'transport', d.transport,
        'eta_minutes', d.eta_minutes,
        'confirmee', d.confirmee,
        'annulee_par', d.annulee_par,
        'motif_annulation', d.motif_annulation,
        'demandeur_prenom', p.prenom,
        'demandeur_nom', p.nom,
        'demandeur_photo', p.photo_url,
        'demandeur_telephone', case when d.telephone_visible then coalesce(d.telephone, p.telephone) end,
        'demandeur_id', case when d.acceptee then d.demandeur_id end
      ) order by coalesce(d.programmee_pour, d.created_at) desc)
      from mes_demandes d
      join public.profiles p on p.id = d.demandeur_id
    ), '[]'::json),
    'services', coalesce((
      select json_agg(json_build_object(
        'id', s.id, 'nom', s.nom, 'noms', public.noms_service(s),
        'propose', exists (
          select 1 from public.intervenant_services x
          where x.intervenant_id = auth.uid() and x.service_id = s.id
        )
      ) order by s.ordre)
      from public.services s
      where s.espace_id = (select espace_id from moi) and s.actif
    ), '[]'::json),
    'avis', json_build_object(
      'moyenne', (select round(avg(note)::numeric, 1) from mes_avis),
      'nombre', (select count(*) from mes_avis),
      'liste', coalesce((
        select json_agg(json_build_object(
          'id', a.id, 'note', a.note, 'commentaire', a.commentaire, 'created_at', a.created_at,
          'prenom', a.prenom, 'nom', a.nom, 'photo', a.photo_url,
          'service', a.service_nom, 'service_noms', a.service_noms
        ) order by a.created_at desc)
        from mes_avis a
      ), '[]'::json)
    )
  );
$$;
