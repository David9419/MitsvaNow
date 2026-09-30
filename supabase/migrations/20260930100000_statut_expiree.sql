-- Nouveau statut « expirée » : personne n'a répondu à temps, ou personne n'est
-- disponible à proximité. (À part : un nouveau statut doit exister avant d'être utilisé.)
alter type public.statut_demande add value if not exists 'expiree';
