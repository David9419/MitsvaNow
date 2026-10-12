-- Vérification des comptes : nouveau statut « suspendu »
-- (à part : une nouvelle valeur d'enum ne peut pas servir dans la même transaction)
alter type public.statut_validation add value if not exists 'suspendu';
