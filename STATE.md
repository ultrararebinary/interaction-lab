# État — interaction lab

Mis à jour le 10 novembre 2026.

## Objectif

Un second labo public, inspiré de l'interaction lab d'Emil Kowalski : Claude génère des vagues de six interactions (skill `lab-wave`), Yann les essaie et donne son avis sur le site local, puis `lab-taste` lit les avis, met à jour le profil de goûts et publie ce qui est gardé. Décisions : `docs/decisions.md`. Règles des vagues : `RULES.md`.

## Ce qui existe

- Site Vite + React + TypeScript : grille de cartes, cadre commun, page Taste, thèmes clair et sombre repris d'Experiments.
- Plugin `plugins/lab.ts` : liste des interactions (toutes en développement, seulement `kept.json` au build) et enregistrement des avis dans `.lab/feedback.json`.
- Panneau d'avis (`src/review/`), chargé seulement sur le serveur de développement.
- `scripts/check-public.mjs` (lancé par `npm run build`) et `scripts/check.mjs` (`npm run check`).
- Publié le 9 novembre 2026 : dépôt public https://github.com/ultrararebinary/interaction-lab (MIT, branche `main`), site https://ultrararebinary.github.io/interaction-lab/ déployé par `.github/workflows/deploy.yml` (Pages, source GitHub Actions). Le premier run a échoué faute de Pages activé, puis a réussi après activation et relance.
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

## Vérifié en ligne le 9 novembre 2026

- Le site répond 200 ; son JavaScript ne contient ni le geste de Latch, ni `__lab/feedback`, ni le texte du panneau. Accueil (état vide) et page Taste affichés dans le navigateur intégré, sans panneau ni erreur console.
- Le dépôt contient le code de Latch (carte d'essai, jamais publiée sur le site) : c'est voulu, c'est le modèle de dossier pour lab-wave.

## Vague 1 (9 novembre 2026), lue le 10 novembre 2026

Six cartes en exploration (pas encore de profil de goûts), hors commit comme le veut `docs/decisions.md` :

- Linger (info-bulle) : reste après le départ du pointeur, un trait d'accent se vide pendant l'attente. Variantes brief (500 ms) et patient (1500 ms).
- Teeter (curseur) : on tient un bout de la barre, elle penche et la bille roule en accélérant ; un appui court avance d'un cran.
- Sweep (liste de cases) : un trait sur les cases coche ou décoche toutes celles qu'il traverse, avec une traînée qui s'efface.
- Plumb (champ de texte) : un fil à plomb pend sous le curseur de texte et se balance quand il bouge. Variantes loose et calm (amortissement).
- Fan (sélecteur) : les options sont les lames d'un nuancier qui s'ouvrent en éventail autour d'un rivet.
- Shove (fil d'Ariane) : en descendant dans les dossiers, les plus anciens éléments s'empilent comme des fiches vues de profil.

Vérifié le 9 novembre 2026 : `npm run build` (« 0 kept, 7 not kept left out ») ; `npm run check -- --wave 1` sans erreur ni débordement, captures regardées dans les deux thèmes ; dans le navigateur intégré, à la souris : Fan s'ouvre (angles mesurés de -13° à -52°), choisit au clic et en glissant, s'utilise au clavier ; Linger s'ouvre au survol et son trait se vide de façon régulière (0,83 → 0,53 → 0,23) avant fermeture à 500 ms ; Teeter avance d'un cran sur un appui court (42 → 43) et accélère sur un appui tenu (44, 49, 58, 72, 91) ; Sweep coche quatre lignes d'un glisser ; Plumb balance le poids après un clic au début du nom ; Shove empile en poussant de droite à gauche, soulève une fiche survolée et remonte au clic. Console sans erreur. Branches « mouvement réduit » relues.

Pas vérifié : les gestes au doigt sur un vrai téléphone (seul le toucher simulé de `npm run check` a tourné) ; le maintien de Teeter avec un vrai bouton de souris tenu (essayé avec des événements synthétiques) ; Linger et Sweep au clavier, seulement relus.

## Vague 2 (10 novembre 2026), lue le 10 novembre 2026

Six cartes en exploration (toujours pas de profil de goûts, la vague 1 n'a pas encore d'avis), hors commit :

- Wind (choix de durée) : on tourne un cadran qui cède à 30 % puis passe au cran suivant (5 min par cran de 30°) ; un ressort spiral se resserre de 1,5 à 7,5 tours.
- Spool (bouton Annuler) : on tire un ruban hors du bouton, chaque repère sorti annule une modification ; le titre montre en direct les mots barrés et ceux qui reviennent ; le ruban reste sorti pour indiquer jusqu'où on est revenu.
- Reed (liste à réordonner) : les lignes que la ligne déplacée croise plient depuis leur bord gauche, selon sa vitesse, puis oscillent avant de se redresser.
- Dent (bouton) : les lettres proches du doigt s'écrasent et s'écartent, un creux de couleur suit le doigt, le bouton reprend sa forme au ressort. Variantes ferme et souple.
- Louver (mot de passe) : chaque caractère est caché sous une lamelle ; celles qui sont sous le doigt pivotent jusqu'à se mettre de profil. Variantes étroite (environ 3 lamelles) et large (environ 9).
- Seam (onglets) : le nouveau panneau s'ouvre depuis une couture placée sous l'onglet cliqué, et l'ancien s'écarte de 12 px de chaque côté.

Vérifié le 10 novembre 2026 : `npm run build` (« 0 kept, 13 not kept left out ») ; `npm run check -- --wave 2` sans erreur ni débordement, lancé deux fois (la seconde après les retouches de Spool et Louver), captures regardées dans les deux thèmes. Dans le navigateur intégré, à la souris (CDP) : Wind passe de 25 à 40 min sur un quart de tour, cède à 30 % entre deux crans (240° puis 243° pour 10° de main) et se cale en environ 60 ms ; Spool revient à l'édition 3 quand on tire trois repères, l'aperçu barre et souligne les bons mots, un clic sur Undo sort un repère en glissant ; Reed descend une ligne de deux places, et les voisines plient jusqu'à environ 1,7° à 360 px/s puis oscillent ; Dent écrase les lettres de 14 % (ferme) ou d'environ 23 % (souple), avec un rebond, et compte un envoi au relâcher ; Louver ouvre 3 lamelles autour du doigt (9 en large), les referme en moins de 360 ms, place le curseur au clic, et l'œil les ouvre toutes ; Seam ouvre le panneau depuis x = 197 px sous Gear et retire l'ancien à la fin. Clavier essayé sur les six cartes : changement immédiat, sans animation. Console sans erreur. Branches « mouvement réduit » relues.

Retouches pendant la vague : icônes Redo et bobine de Spool redessinées (la bobine ressemblait à un volant) ; mot de passe par défaut de Louver raccourci à 15 caractères et limite portée à 18, parce que la valeur de départ remplissait déjà la limite.

Pas vérifié : les gestes au doigt sur un vrai téléphone (seul le toucher simulé de `npm run check` a tourné) ; le geste circulaire de Wind avec une vraie souris qui fait le tour complet (essayé en quart de tour, et en événements synthétiques) ; les mesures fines de Reed, Dent et Louver, prises avec des événements synthétiques.

Note : pendant cette vague, le port 4330 était déjà occupé par le serveur de développement lancé depuis une autre conversation sur ce même dossier. Les vérifications ont tourné sur ce serveur, qui sert les mêmes fichiers.

## Première lecture des goûts (10 novembre 2026, vagues 1 et 2)

Onze avis lus ; Fan (vague 1) n'en a pas encore et reste en attente. Lecture validée par Yann, avec ses réponses : retoucher d'abord, une seule variante pour Louver et Linger, une seule nouvelle tentative autorisée pour l'idée de Dent, « sans encourager la répétition ». Profil privé dans `.lab/TASTE.md`.

- Gardées : Reed, Louver (variante wide seule), Spool, Wind, Linger (variante brief seule), Sweep.
- Publiées dans `kept.json` : Reed et Louver seulement. Spool, Wind, Linger et Sweep ont été retouchées (nouvelle règle « After a reading » de `RULES.md`) et attendent que Yann les réessaie avant d'entrer dans `kept.json` avec leur phrase.
- Retouches : Wind suit la main en continu et se cale au relâcher avec un ressort (raideur 300, amortissement 34, élan projeté sur 100 ms, au plus un cran et demi), au lieu de céder à 30 % puis de sauter ; dans Spool, les mots du titre glissent vers leur nouvelle place (FLIP, 240 ms) et les mots qui reviennent apparaissent en fondu (180 ms) ; Linger sort du mot en montant de 6 px (200 ms), glisse d'un mot à l'autre (240 ms) avec un léger flou sur le nouveau texte, pâlit et s'affaisse pendant les 500 ms d'attente, puis se ferme en 150 ms ; dans Sweep, chaque case réagit d'une petite pression en changeant d'état et une ligne barre le nom des objets cochés. Un trait qui s'affinait derrière le doigt avait aussi été essayé ; à la demande de Yann, Sweep a retrouvé son trait d'origine (trait plein qui s'efface en 400 ms).
- Jetées, dossiers mis dans la corbeille du Mac (jamais commités, donc encore récupérables là) : Plumb, Shove, Teeter, Dent, Seam. Leur trace reste dans `.lab/feedback.json` et `.lab/ideas.json`.
- `RULES.md` : trois règles ajoutées, validées par Yann (l'idée doit rendre le composant meilleur dans son usage ; ce qu'on glisse suit la main en continu ; une retouche avant publication quand l'avis la demande).
- Page Taste réécrite (`content/taste.md`), en ne nommant que les cartes publiées.

Vérifié le 10 novembre 2026 : `npm run build` (« 2 kept in, 6 not kept left out ») ; site public servi par `vite preview` (4331) : Louver et Reed avec leur phrase, page Taste, à 390 px et à 1280 px, sans panneau, sans débordement, console sans erreur ; `npm run check` sur les 8 cartes du serveur de développement, sans erreur ni débordement. Retouches essayées : Wind à la souris, puis avec une horloge d'images simulée (le cadran suit 1:1, puis se cale sur 240° sans dépasser) ; Spool avec des événements synthétiques (les mots glissent et les mots qui reviennent apparaissent en fondu, durées lues sur les animations) ; Linger au survol avec la vraie souris (ouverture, glissement vers « canary » avec une transition de 240 ms, attente puis fermeture) ; Sweep à la souris (3 cases cochées d'un trait, 3 petites pressions, ligne barrée), puis de nouveau après le retour du trait d'origine (trait dessiné, effacé en 400 ms, `npm run check -- --wave 1` sans erreur).

Pas vérifié : le rendu en temps réel des retouches. Pendant les essais, le navigateur intégré tournait à environ 4 images par seconde parce que la fenêtre n'était pas visible, donc la fluidité reste à juger par Yann. Pas d'essai non plus au doigt sur un vrai téléphone.

## Prochaines étapes

1. Yann réessaie Spool, Wind, Linger et Sweep retouchées sur le serveur local. Celles qui lui conviennent entrent dans `kept.json` avec une phrase revue, et la page Taste peut alors les nommer.
2. Les quatre cartes retouchées et Fan restent hors des commits jusqu'à ce que Yann les valide. La lecture elle-même (Reed, Louver, `kept.json`, `content/taste.md`, `RULES.md`, `STATE.md`) est commitée le 10 novembre 2026, sans push.
3. Vague 3 avec `/lab-wave`, qui lira `.lab/TASTE.md` : quatre idées guidées et deux explorations.
4. Avec l'accord de Yann : ajouter le lien vers le labo depuis l'accueil d'Experiments (le labo est en ligne). Attention : à chaque push, vérifier que seules les cartes de `kept.json` et la page Taste changent côté public.
