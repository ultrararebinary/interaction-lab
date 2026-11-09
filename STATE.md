# État — interaction lab

Mis à jour le 9 novembre 2026.

## Objectif

Un second labo public, inspiré de l'interaction lab d'Emil Kowalski : Claude génère des vagues de six interactions (skill `lab-wave`), Yann les essaie et donne son avis sur le site local, puis `lab-taste` lit les avis, met à jour le profil de goûts et publie ce qui est gardé. Décisions : `docs/decisions.md`. Règles des vagues : `RULES.md`.

## Ce qui existe

- Site Vite + React + TypeScript : grille de cartes, cadre commun, page Taste, thèmes clair et sombre repris d'Experiments.
- Plugin `plugins/lab.ts` : liste des interactions (toutes en développement, seulement `kept.json` au build) et enregistrement des avis dans `.lab/feedback.json`.
- Panneau d'avis (`src/review/`), chargé seulement sur le serveur de développement.
- `scripts/check-public.mjs` (lancé par `npm run build`) et `scripts/check.mjs` (`npm run check`).
- Workflow GitHub Pages prêt (`.github/workflows/deploy.yml`), jamais lancé : pas de dépôt GitHub.
- Vague 0 : la carte d'essai Latch (`interactions/latch/`), statut `trial`.
- `.lab/ideas.json` (registre), `.lab/feedback.json` (un avis de test sur Latch). Pas encore de `.lab/TASTE.md`.

## Vérifié le 9 novembre 2026

- `npm run build` passe : type check, build, contrôle public (« no review panel, 0 kept, 1 not kept left out »). `grep` dans `dist/` : ni le geste de Latch, ni `__lab`, ni le texte du panneau.
- Contre-épreuve : avec Latch inscrit dans `kept.json`, le build l'inclut, toujours sans panneau ; servi par `vite preview`, la carte s'affiche avec sa phrase, `/__lab/feedback` répond 404. `kept.json` remis à `[]` ensuite.
- Panneau dans le navigateur intégré : Drop, étiquette motion et note saisis, Save ; `.lab/feedback.json` contient l'avis ; après rechargement, le formulaire est prérempli et le compteur affiche « Wave 0: 1 of 1 reviewed ». Console sans erreur.
- Latch : glisser à la souris (CDP) jusqu'au bout, `aria-checked` passe à `true` ; un clic le ramène avec la transition (translation mesurée à 3,9 px en cours, 0 à la fin).
- `npm run check` : aucune erreur, aucun débordement (sombre et clair, avec et sans mouvement réduit, 390 et 1280 px). Contre-épreuve avec une carte qui lève une erreur au clic : le script la signale et sort en erreur.
- Site public à 390 px en thème clair : accueil vide et page Taste, sans défilement horizontal.

## Pas vérifié

- Le glisser de Latch au doigt sur un vrai téléphone (seul un toucher simulé a été essayé).
- Le mouvement réduit de Latch au-delà de la lecture du CSS et de l'absence d'erreur sous émulation.
- Le workflow GitHub Pages (aucun dépôt).

## Prochaines étapes

1. Première vraie vague, dans une nouvelle session Claude Code ouverte dans AIOS ou dans ce dossier : `/lab-wave`.
2. Après deux ou trois vagues : `/lab-taste`.
3. Avec l'accord de Yann : créer le dépôt `ultrararebinary/interaction-lab`, activer Pages (source GitHub Actions), pousser, puis ajouter le lien depuis l'accueil d'Experiments.
