# Mivtsa Now — Guide du projet pour Claude

Plateforme qui met en relation une personne qui a besoin d'une mitsva / d'un service
(téfilines, mezouza, 'hallot, cacheroute, bar-mitsva…) avec **l'intervenant disponible
le plus proche**, trouvé par géolocalisation. L'intervenant reçoit une notification,
accepte (en disant comment il vient et quand il arrive), le demandeur confirme, et
l'intervenant se rend sur place.

- Site en ligne : **https://mivtsa-now.com** (domaine acheté chez Amen.fr ; ancienne adresse
  https://mitsva-now.vercel.app toujours active)
- Code : GitHub `David9419/MitsvaNow` (branche `main` = site en ligne)

## Qui nous sommes
L'équipe ne sait pas coder. Claude doit :
- expliquer chaque étape **simplement, en français**, sans jargon (ou en l'expliquant) ;
- construire **une seule fonctionnalité à la fois** (sauf si on demande un lot) ;
- à la fin de chaque fonctionnalité, donner des **instructions de test pas à pas**
  (quoi ouvrir, où cliquer, ce qu'on doit voir) et **attendre notre validation**
  avant de passer à la suivante ;
- ne jamais supprimer ou réécrire une partie qui marche sans nous prévenir ;
- quand quelque chose ne marche pas, **regarder d'abord les journaux** (logs Supabase :
  auth, edge functions, `net._http_response`, `cron.job_run_details`) avant de deviner ;
- quand une action doit être faite par nous (réglage Supabase, Google, Vercel…),
  donner les étapes **champ par champ**, avec les valeurs exactes à mettre.

## Stack technique
- **Next.js 16** (App Router, TypeScript) — le site/l'application.
  Attention : `src/proxy.ts` remplace l'ancien `middleware`, `searchParams` est
  asynchrone, formulaires en *server actions* + `useActionState`. Voir `AGENTS.md`.
- **Supabase** — base de données (PostgreSQL + PostGIS), comptes, temps réel,
  stockage des photos (Storage), tâches automatiques (pg_cron), Edge Function pour les
  notifications, coffre-fort (Vault) pour les clés secrètes.
- **Tailwind CSS v4** — mise en forme (couleurs en variables dans `src/app/globals.css`).
- **shadcn/ui** — composants dans `src/components/ui/` (le site ui.shadcn.com est bloqué
  depuis l'environnement de Claude : les composants se récupèrent sur GitHub raw).
- **Vercel** — hébergement. Chaque envoi sur `main` met le site en ligne à jour tout seul
  (1 à 2 minutes). Chaque autre branche a une adresse d'essai (« Preview »).

## Projets externes
- **Supabase** : toujours le projet **« Mivstaim Now »** (id `otwsxjchgbwporwldrkw`,
  région eu-west-1). Ne jamais toucher aux autres projets du compte (IdeaVault, AutoFlow AI…).
- **Vercel** : projet `mitsva-now`. L'adresse et la clé **publique** Supabase sont aussi
  écrites en secours dans `src/lib/supabase/config.ts` : ce ne sont pas des secrets.
- **E-mails** (mot de passe oublié) : Gmail via le réglage SMTP de Supabase
  (`smtp.gmail.com`, port 465, `david.avielpro@gmail.com` + mot de passe d'application Google).
  Modèle « Reset Password » : `supabase/templates/mot-de-passe-oublie.html` (en français).
- **Supabase Auth → URL Configuration** : Site URL `https://mivtsa-now.com`,
  Redirect URLs `https://mivtsa-now.com/**`, `https://www.mivtsa-now.com/**`,
  `https://mitsva-now.vercel.app/**`. « Confirm email » est désactivé.
- **Domaine** `mivtsa-now.com` (Amen.fr → Configuration DNS → Modifier la zone DNS) :
  `A @ 216.198.79.1` et `CNAME www c52472c46c76650e.vercel-dns-017.com.` ; sur Vercel,
  `mivtsa-now.com` redirige (308) vers `www.mivtsa-now.com`. Ne pas toucher aux lignes e-mail d'Amen
  (MX, TXT, SRV, autoconfig, mail, smtp, webmail, key-amfr…).
- **Instagram** : https://www.instagram.com/mivtsanow (bouton flottant, `src/components/bouton-instagram.tsx`).

## Environnement de Claude
- L'accès réseau vers `vercel.app` et `supabase.co` est bloqué depuis le terminal :
  on vérifie la base avec les outils MCP Supabase. Pour tester un parcours complet,
  on simule les utilisateurs en SQL dans un bloc `do $$ … raise exception 'RESULTAT' … $$`
  (tout est annulé à la fin).
- Outils MCP Supabase : un SQL contenant `drop`, `revoke` ou `delete from` reste bloqué
  (il attend une confirmation invisible ici). Écrire les migrations sans ces mots :
  `create or replace`, colonne `active` plutôt que supprimer, fonctions internes dans
  le schéma `prive` plutôt que `revoke`.
- Ne jamais lancer `pkill -f` avec un motif présent dans la commande (ça tue le shell).
- Vérifier un écran : `next build` + `next start`, captures Playwright
  (`executablePath: /opt/pw-browsers/chromium`), cookie `langue` pour changer de langue.

## Conventions
- **Aucun texte en dur dans les composants** : tout est dans les dictionnaires
  `src/lib/i18n/fr.ts` (référence), `he.ts`, `en.ts` (même structure, vérifiée par TypeScript).
  Côté serveur : `obtenirDico()` ; côté navigateur : `useT()` et `useLangue()`.
  Dates / distances : `formaterDateHeure`, `ilYa`, `formaterDistance` de `@/lib/i18n`.
  Noms des services : colonnes `nom`, `nom_he`, `nom_en` (fonction SQL `noms_service`),
  affichés avec `nomService(noms, repli, langue)`.
- Hébreu = lecture de droite à gauche : utiliser les classes « logiques »
  (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`) et `rtl:` pour les flèches.
- Noms de fichiers, fonctions et variables en français.
- Les clés secrètes ne vont **jamais dans Git** (Vault Supabase pour les notifications).
- Chaque changement de base passe par un fichier dans `supabase/migrations/`, puis
  `src/lib/database.types.ts` est **regénéré** (outil MCP `generate_typescript_types`).
- Toute nouvelle fonction SQL appelée par le site : `security definer`, `set search_path = ''`,
  vérifier `auth.uid()`, `revoke … from public, anon` puis `grant` au bon rôle.
  Les messages d'erreur SQL restent en français ; leur traduction est dans `erreursBase`
  des dictionnaires (utilisée par `messageErreur(e, t)`).
- Row Level Security activée sur **toutes** les tables.
- Avant chaque envoi : `npx eslint src`, `npm run build`, `npx tsc --noEmit` doivent passer.
- Petits commits, message clair en français.
- **Mise en ligne automatique (demandé par l'équipe)** : chaque modification terminée et vérifiée
  (lint + build) est envoyée sur la branche de la session **et aussi sur `main`**, pour que
  Vercel mette le site à jour tout de suite. Pas besoin de redemander l'accord à chaque fois.

## Ce qui est construit

### Les 5 espaces et leurs services (8 par espace d'intervenants)
| Espace (slug) | Rôle | Services |
|---|---|---|
| **Demandeurs** (`demandeurs`) | fait des demandes | — |
| **Bahourim / Hassidim** (`bahourim`) | `bahour` | Téfilines · Mezouza · Boîte de tsédaka · Sefer/livre/siddour · Compléter un minyan · Étude / חברותא · Visite à une personne seule · Aide pour préparer un kiddouch |
| **Équipe féminine** (`equipe-feminine`) | `femme` | 'Hallot · Bougies et horaires de Chabbat · Cours · Aider à préparer Chabbat · Visite à une personne seule · Accompagner à un rendez-vous · Faire les courses · Écoute et soutien |
| **Sofer / Rav / Rabbanit** (`sofer-rav-rabbanit`) | `sofer`, `rav`, `rabbanit` | Cacheroute · Bérakhot · Question et accompagnement · Mariage · Vérification téfilines/mezouzot · Conseil éducation des enfants · Brit mila · Cours de Torah |
| **Chaliah** (`chaliah`) | `chaliah` | Éducation juive · Bar-mitsva · Paracha · Visites · Séouda / cours · Collecte pour une famille · Calendriers juifs · Créer un minyan |

Le slug `bahourim` n'a pas changé (seul le nom affiché est « Bahourim / Hassidim »).
Structure des espaces : `src/lib/espaces.ts` ; textes : `t.espaces[slug]` (dont `plus` =
services affichés par « Voir plus » sur l'accueil).

### Règles du jeu
1. **Inscription** : espace imposé quand on vient du bouton d'un espace ; **photo du visage
   obligatoire** (réduite dans le navigateur, rangée dans Storage `photos/<id>/…`) ;
   position (GPS ou adresse) ; pas de validation des intervenants.
2. **Demande** : service, **maintenant ou programmée** (jour + heure, 15 min à 3 mois),
   adresse, téléphone obligatoire, message facultatif.
3. **Diffusion** (`attribuer_demande`) : la demande est envoyée **en même temps à tous**
   les intervenants disponibles de l'espace dont le rayon atteint le demandeur, qui
   proposent le service et ne l'ont pas refusée (table `demande_propositions`, colonne
   `active`). **Le premier qui accepte la prend** : elle disparaît chez les autres (un
   2e « Accepter » reçoit « Un autre intervenant a déjà accepté cette demande. »). Si
   l'intervenant annule, ou si le demandeur « cherche quelqu'un d'autre », la demande
   **repart chez tous** (sauf lui). Un intervenant qui se met disponible ou change de
   position reçoit les demandes en attente autour de lui.
4. **Délais automatiques** (`expirer_demandes`, pg_cron chaque minute) :
   personne n'a accepté 15 min après `recherche_depuis` (ou à l'heure prévue pour une
   programmée) → statut `expiree`, le demandeur est prévenu ;
   confirmation du demandeur d'office au bout de 10 min.
5. **Acceptation** : l'intervenant choisit son transport (à pied, trottinette, vélo,
   voiture, transports) et son délai d'arrivée. Le demandeur voit photo, téléphone,
   transport, délai, distance, note ★ et avis ; il **confirme** ou **cherche quelqu'un
   d'autre** (l'intervenant est prévenu, la recherche repart). « Je suis en route » n'est
   possible qu'après confirmation.
6. **Annulation avec motif** (demandeur : `annuler_demande` ; intervenant :
   `annuler_intervention`) : l'autre est prévenu (notification + message « Messages »
   dans son espace) et la demande disparaît des listes.
7. **Avis** : étoiles + petit mot ; l'intervenant est prévenu, voit sa moyenne sur 5,
   le nombre d'avis et la liste avec le nom des personnes (carte « Mes avis »).
8. **Paramètres** (`/accueil/parametres`, bouton ⚙️ de chaque espace) : photo (galerie ou
   appareil photo), prénom, nom, téléphone, e-mail non modifiable, changement de mot de
   passe (ancien + nouveau + confirmation), mot de passe oublié, notifications
   (activer / couper), mode sombre, langue.
   Thème : interrupteur jour/nuit animé (`src/components/mode-toggle.tsx`, ouverture en
   cercle via `src/lib/theme-anime.ts`) ; langue : pastille drapeau + code avec voile
   « Bienvenue » animé (`src/components/selecteur-langue.tsx`).
9. **Langues** : français, hébreu (droite à gauche, police Heebo), anglais ; bouton dans
   l'en-tête ; cookie `langue` + `profiles.langue` (les notifications partent dans la
   langue de chaque personne).

### Base de données (Supabase)
- `espaces`, `services` (`nom`, `nom_he`, `nom_en`), `profiles` (+ `photo_url`, `langue`),
  `intervenants`, `intervenant_services`, `demande_refus`, `demande_propositions`
  (à qui la demande est envoyée ; `active = false` au lieu de supprimer), `avis`,
  `abonnements_push`.
- Schéma `prive` (non exposé au site) : `peut_recevoir`, `proposer_a_intervenant`,
  `evenement_proposition` (notification « nouvelle » quand une proposition devient active).
- `demandes` : statut (`en_attente` → `acceptee` → `en_cours` → `terminee`, ou `annulee` /
  `expiree`), `programmee_pour`, `transport`, `eta_minutes`, `acceptee_le`, `confirmee`,
  `annulee_par`, `motif_annulation`, `recherche_depuis`, `attribuee_le`.
- Fonctions : `creer_demande`, `attribuer_demande`, `repondre_demande`,
  `confirmer_intervenant`, `avancer_demande`, `annuler_demande`, `annuler_intervention`,
  `expirer_demandes`, `mettre_a_jour_intervenant`, `tableau_intervenant`,
  `tableau_demandeur`, `enregistrer_ma_position`, `ma_position`, `definir_photo`,
  `definir_langue`, `enregistrer_abonnement_push`, `email_inscrit`.

### Notifications
- Un seul déclencheur `evenements_demande` (+ `evenement_avis`) → `notifier()` → pg_net
  → Edge Function **`notifier-demande`** (`supabase/functions/notifier-demande/`, sans
  vérification JWT, protégée par `x-secret`) qui écrit le texte dans la langue du destinataire.
- Événements : intervenant ← `nouvelle`, `confirmee`, `refusee`, `annulee`, `avis` ;
  demandeur ← `acceptee`, `en_cours`, `terminee`, `annulee`, `expiree`, `relance`
  (l'intervenant a annulé, la demande repart chez tous).
- Clés dans le Vault : `push_vapid_public`, `push_vapid_prive`, `push_secret_declencheur`.
- iPhone : seulement si le site est installé sur l'écran d'accueil.
- Diagnostic : `abonnements_push`, `net._http_response`, logs de l'Edge Function.

### Où se trouve quoi
- `src/app/page.tsx` — accueil ; `src/components/landing/` — ses morceaux.
- `src/app/(auth)/` — inscription, connexion, mots de passe (`actions.ts` = actions serveur).
- `src/app/accueil/` — tableau de bord ; `demandes/` (demandes perso d'un intervenant) ;
  `parametres/`.
- `src/components/tableau/` — tableaux de bord (cartes, fenêtres d'acceptation et
  d'annulation, avis, messages) ; `src/components/parametres/`.
- `src/lib/i18n/` — langues ; `src/lib/tableau/` — outils ; `src/hooks/`.
- `src/proxy.ts` — protège `/accueil` (connexion obligatoire).

### Identité graphique
- Logo : `public/logo.png`, `public/logo-mark.png` ; icônes dans `public/icones/`.
- Polices : Unbounded (titres), Figtree (texte), Heebo (hébreu).
- Couleurs : `primary`, `accent`, `success`… dans `globals.css` (voir `Project.md` § 5).
- Ton : chaleureux, simple, « vous », textes courts.

### Idées pour la suite (non faites)
- Espace administrateur (toutes les demandes, intervenants, statistiques).
- Nom de domaine à nous et service d'e-mails dédié.

@AGENTS.md
