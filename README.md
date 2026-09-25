# Mivtsa Now

Plateforme de mise en relation : une personne fait une demande (téfilines, 'hallot, cachérisation…) et la plateforme trouve l'intervenant disponible le plus proche.

Le cahier des charges complet est dans [`Project.md`](./Project.md).

## Lancer le site sur votre ordinateur

1. Installer les dépendances (une seule fois) :
   ```bash
   npm install
   ```
2. Créer le fichier des clés Supabase (une seule fois) :
   ```bash
   cp .env.example .env.local
   ```
3. Démarrer le site :
   ```bash
   npm run dev
   ```
4. Ouvrir <http://localhost:3000> dans le navigateur.

Pour arrêter le site : appuyer sur `Ctrl + C` dans le terminal.

## Mettre le site en ligne (Vercel)

1. Sur <https://vercel.com>, se connecter avec GitHub, puis **Add New… → Project**.
2. Importer le dépôt **MitsvaNow** (branche `main`). Framework détecté : **Next.js**.
3. Dans **Environment Variables**, ajouter les deux valeurs de `.env.example` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Cliquer sur **Deploy**.
5. Dans Supabase → **Authentication → URL Configuration** :
   - **Site URL** : l'adresse Vercel (ex. `https://mivtsa-now.vercel.app`)
   - **Redirect URLs** : ajouter `https://mivtsa-now.vercel.app/**`

Ensuite, chaque envoi sur la branche `main` met le site en ligne à jour automatiquement.
