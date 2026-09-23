# Mivtsa Now — Guide du projet pour Claude

## Qui nous sommes
L'équipe ne sait pas coder. Claude doit :
- expliquer chaque étape **simplement, en français**, sans jargon (ou en l'expliquant) ;
- construire **une seule fonctionnalité à la fois** ;
- à la fin de chaque fonctionnalité, donner des **instructions de test pas à pas**
  (quoi ouvrir, où cliquer, ce qu'on doit voir) et **attendre notre validation**
  avant de passer à la suivante ;
- ne jamais supprimer ou réécrire une partie qui marche sans nous prévenir.

## Stack technique
- **Next.js** (App Router, TypeScript) — le site/l'application
- **Supabase** — base de données, comptes utilisateurs (authentification)
- **Tailwind CSS** — mise en forme
- **shadcn/ui** — composants d'interface prêts à l'emploi (boutons, cartes, formulaires…)

## Conventions
- Textes de l'interface en français.
- Les clés secrètes Supabase vont dans `.env.local` (jamais dans Git).
- Chaque changement de base de données passe par un fichier de migration dans `supabase/migrations/`.
- Petits commits, avec un message clair en français.

## Cahier des charges

> 📄 Le cahier des charges détaillé (espaces, charte graphique, schéma de base de données, étapes) est dans **`Project.md`**. Il fait foi.
>
> ⚠️ Les sections ci-dessous non couvertes par `Project.md` restent à compléter.

### Tableau des mitsvot
_(à coller)_

### Règles du jeu
_(à coller)_

### Schéma de la base de données
_(à coller)_

### Identité graphique
_(à coller : couleurs, polices, logo, ton)_

@AGENTS.md
