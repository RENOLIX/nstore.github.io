# NStore Football

Boutique de maillots de football, en React et Vite.

## Lancer en local

```bash
npm install
npm run dev
```

## Modifier le catalogue

Les maillots, leurs prix et les diapositives du carrousel sont dans `src/data.js`.
Les photos sont dans `public/img`, chacune en version PC (`-desktop.jpg`) et téléphone (`-mobile.jpg`).

## Mise en ligne

Chaque envoi sur la branche `main` reconstruit le site et le publie sur GitHub Pages
(voir `.github/workflows/deploy.yml`).

Le paiement est simulé : aucune commande n'est réellement enregistrée.
