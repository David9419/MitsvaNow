-- =====================================================================
-- Plus de validation des intervenants : chaque compte est actif tout de
-- suite. Chacun gère lui-même sa disponibilité, sa position et ses services.
-- =====================================================================

alter table public.intervenants alter column validation set default 'valide';
update public.intervenants set validation = 'valide' where validation <> 'valide';
