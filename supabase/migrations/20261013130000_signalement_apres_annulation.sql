-- =====================================================================
-- Signalements : 2 améliorations
-- 1. On peut signaler l'autre personne même après une annulation :
--    on retient le dernier intervenant d'une demande (dernier_intervenant_id)
--    quand il annule, est écarté par le demandeur ou est suspendu.
-- 2. Les administrateurs reçoivent une notification à chaque signalement.
-- =====================================================================

alter table public.demandes
  add column if not exists dernier_intervenant_id uuid references public.profiles (id) on delete set null;

-- Quand une demande repart en recherche, on garde qui était l'intervenant
do $$
declare
  f text;
  def text;
begin
  foreach f in array array[
    'public.annuler_intervention(uuid,text)',
    'public.confirmer_intervenant(uuid,boolean)',
    'public.admin_decider(uuid,text,text)'
  ] loop
    def := pg_get_functiondef(f::regprocedure);
    if position('dernier_intervenant_id' in def) = 0 then
      def := replace(def,
        'set statut = ''en_attente'', intervenant_id = null,',
        'set statut = ''en_attente'', dernier_intervenant_id = intervenant_id, intervenant_id = null,');
      execute def;
    end if;
  end loop;
end;
$$;

-- L'autre personne d'une demande (y compris l'intervenant qui a annulé)
create or replace function prive.autre_personne(p_demande uuid, p_moi uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when d.demandeur_id = p_moi then coalesce(d.intervenant_id, d.dernier_intervenant_id)
    when d.intervenant_id = p_moi
      or d.dernier_intervenant_id = p_moi
      or exists (select 1 from public.demande_propositions x where x.demande_id = d.id and x.intervenant_id = p_moi)
      or exists (select 1 from public.demande_refus x where x.demande_id = d.id and x.intervenant_id = p_moi)
      then d.demandeur_id
  end
  from public.demandes d
  where d.id = p_demande;
$$;

-- Signaler + prévenir les administrateurs
create or replace function public.signaler(
  p_demande uuid, p_motif text, p_details text default null, p_bloquer boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cible uuid;
  v_admin uuid;
begin
  perform prive.exiger_compte_valide();
  if p_motif is null or p_motif not in ('comportement', 'harcelement', 'faux_profil', 'absence', 'danger', 'autre') then
    raise exception 'Choisissez la raison du signalement.';
  end if;
  v_cible := prive.autre_personne(p_demande, v_uid);
  if v_cible is null or v_cible = v_uid then
    raise exception 'Impossible de signaler cette personne.';
  end if;
  if (select count(*) from public.signalements
      where auteur_id = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Trop de signalements aujourd''hui. Réessayez demain.';
  end if;

  insert into public.signalements (auteur_id, cible_id, demande_id, motif, details, bloque)
  values (v_uid, v_cible, p_demande, p_motif, left(nullif(btrim(p_details), ''), 1000), coalesce(p_bloquer, false));

  if p_bloquer then
    perform prive.bloquer(v_uid, v_cible);
  end if;

  -- Notification « Nouveau signalement » à chaque administrateur
  for v_admin in select id from public.profiles where est_admin loop
    perform public.notifier(p_demande, 'signalement', v_admin);
  end loop;
end;
$$;
