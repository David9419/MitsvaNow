-- ---------- Les demandes déjà en attente sont rediffusées ----------
do $$
declare v record;
begin
  for v in select id from public.demandes where statut = 'en_attente' loop
    perform public.attribuer_demande(v.id);
  end loop;
end $$;
