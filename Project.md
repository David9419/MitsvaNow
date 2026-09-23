# Mivtsa Now — Project.md

## 1. Présentation

**Mivtsa Now** est une plateforme web de mise en relation. Une personne qui a un besoin (mettre les téfilines, avoir des 'hallot pour Chabbat, cachériser un four, suivre un cours…) fait une demande. La plateforme **géolocalise l'intervenant disponible le plus proche** dans l'espace concerné, qui vient l'aider.

Le site tourne **en local** pour le moment (pas de mise en ligne immédiate).

## 2. Stack technique

| Élément | Outil |
|---|---|
| Développement | Claude |
| Framework | Next.js (App Router) sur Node.js (déjà installé) |
| Composants UI | shadcn/ui (obligatoire) |
| Base de données / Auth | Supabase |
| Hébergement du code | GitHub |
| Thème clair/sombre | next-themes |
| Polices | next/font/google : **Unbounded** (titres), **Figtree** (texte) |

## 3. Les 4 espaces

Chaque espace a ses intervenants et ses types de demandes. Les exemples ci-dessous ne sont pas limitatifs : d'autres services pourront être ajoutés.

### 3.1 Bahourim
- Intervenants : les bahourim.
- Exemple : quelqu'un veut mettre les téfilines → le bahour le plus proche est géolocalisé et vient les lui mettre.

### 3.2 Équipe féminine
- Intervenantes : les femmes de l'équipe.
- Exemple : quelqu'un a besoin de pain pour Chabbat → la femme la plus proche vient faire les 'hallot avec elle ou lui en apporter.

### 3.3 Sofer / Rav / Rabbanit
- Intervenants : sofer, rav, rabbanit.
- Exemples : cachériser un four, vérifier ou fournir des téfilines, questions de halakha…

### 3.4 Chaliah
- Intervenants : les chlou'him.
- Rôle : éduquer sans imposer la religion — cours, accompagnement, orientation progressive vers la Torah.

## 4. Fonctionnement général

1. L'utilisateur choisit un espace puis un type de demande.
2. Il partage sa position (ou saisit une adresse).
3. La plateforme trouve l'intervenant disponible le plus proche dans cet espace.
4. L'intervenant accepte ou refuse ; si refus, on passe au suivant.
5. Suivi de la demande : en attente → acceptée → en cours → terminée / annulée.

## 5. Charte graphique

### 5.1 Logo
Logo fourni : « M » bleu en dégradé avec une étoile de David et un anneau, texte **Mivtsa** (bleu nuit) et **Now** (bleu vif). Fichier à placer dans `public/logo.png`.

### 5.2 Règles de thème
- Remplacer les couleurs de `globals.css` par celles ci-dessous.
- Ajouter `success` et `success-foreground` au thème pour pouvoir écrire `bg-success`, `text-success-foreground`.
- Charger **Unbounded** (titres) et **Figtree** (texte) avec `next/font/google`.
- Mode sombre avec **next-themes**, comme dans la documentation shadcn.
- **Dropdown Menu** clair / sombre / système dans l'en-tête.
- **N'inventer aucune autre couleur.** Toujours utiliser les tokens (`bg-primary`, `text-muted-foreground`…), jamais de couleurs en dur.

### 5.3 Couleurs

```css
:root {
  --radius: 0.875rem;
  --background: #F3F5FB;
  --foreground: #121A33;
  --card: #FFFFFF;
  --card-foreground: #121A33;
  --popover: #FFFFFF;
  --popover-foreground: #121A33;
  --primary: #2346D8;
  --primary-foreground: #FFFFFF;
  --secondary: #E6EAF5;
  --secondary-foreground: #121A33;
  --muted: #E6EAF5;
  --muted-foreground: #56607D;
  --accent: #FFB320;
  --accent-foreground: #121A33;
  --destructive: #D2393C;
  --success: #1F8A5B;
  --success-foreground: #FFFFFF;
  --border: #D5DBEA;
  --input: #D5DBEA;
  --ring: #2346D8;
  --chart-1: #2346D8;
  --chart-2: #FFB320;
  --chart-3: #1F8A5B;
  --chart-4: #D2393C;
  --chart-5: #56607D;
  --sidebar: #FFFFFF;
  --sidebar-foreground: #121A33;
  --sidebar-primary: #2346D8;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #E6EAF5;
  --sidebar-accent-foreground: #121A33;
  --sidebar-border: #D5DBEA;
  --sidebar-ring: #2346D8;
}

.dark {
  --background: #0E1430;
  --foreground: #EEF1FA;
  --card: #161E42;
  --card-foreground: #EEF1FA;
  --popover: #161E42;
  --popover-foreground: #EEF1FA;
  --primary: #7D93FF;
  --primary-foreground: #0E1430;
  --secondary: #222B55;
  --secondary-foreground: #EEF1FA;
  --muted: #222B55;
  --muted-foreground: #A9B2D3;
  --accent: #FFC54D;
  --accent-foreground: #0E1430;
  --destructive: #F0625F;
  --success: #3DBE86;
  --success-foreground: #0E1430;
  --border: #2A3463;
  --input: #2A3463;
  --ring: #7D93FF;
  --chart-1: #7D93FF;
  --chart-2: #FFC54D;
  --chart-3: #3DBE86;
  --chart-4: #F0625F;
  --chart-5: #A9B2D3;
  --sidebar: #161E42;
  --sidebar-foreground: #EEF1FA;
  --sidebar-primary: #7D93FF;
  --sidebar-primary-foreground: #0E1430;
  --sidebar-accent: #222B55;
  --sidebar-accent-foreground: #EEF1FA;
  --sidebar-border: #2A3463;
  --sidebar-ring: #7D93FF;
}
```

Dans le bloc `@theme inline` de `globals.css`, ajouter :

```css
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
```

## 6. Schéma de base de données (Supabase) — à valider

Proposition de départ, à affiner ensemble.

- **profiles** — lié à `auth.users` : `id`, `nom`, `prenom`, `telephone`, `role` (demandeur / intervenant / admin), `created_at`
- **espaces** — `id`, `slug` (bahourim, equipe-feminine, sofer-rav-rabbanit, chaliah), `nom`, `description`
- **services** — `id`, `espace_id`, `nom` (ex. téfilines, 'hallot, cachérisation four, cours…), `description`, `actif`
- **intervenants** — `id` (= profile), `espace_id`, `type` (bahour, femme, sofer, rav, rabbanit, chaliah), `disponible`, `position` (géographie PostGIS), `rayon_km`
- **intervenant_services** — `intervenant_id`, `service_id` (quels services chacun propose)
- **demandes** — `id`, `demandeur_id`, `service_id`, `intervenant_id` (nullable), `position`, `adresse`, `message`, `statut` (en_attente, acceptee, en_cours, terminee, annulee), `created_at`
- **avis** (optionnel) — `id`, `demande_id`, `note`, `commentaire`

Géolocalisation : extension **PostGIS** + fonction RPC `intervenant_le_plus_proche(service_id, lat, lng)` qui renvoie les intervenants disponibles triés par distance.
Sécurité : **Row Level Security** activée sur toutes les tables.

## 7. Étapes

1. Initialiser le projet Next.js + shadcn/ui, pousser sur GitHub.
2. Appliquer le thème (couleurs, polices, mode sombre, sélecteur de thème dans l'en-tête).
3. Intégrer le logo.
4. Valider puis créer le schéma Supabase.
5. Authentification (demandeurs / intervenants).
6. Pages des 4 espaces et formulaire de demande.
7. Géolocalisation et attribution de l'intervenant le plus proche.
8. Tableau de bord intervenant (accepter / refuser / suivre les demandes).
