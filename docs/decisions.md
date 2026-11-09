# Interaction lab — décisions

Décidé avec Yann le 9 novembre 2026, dans le chat Claude Code qui a créé le labo. Une décision change seulement sur demande de Yann, avec la date et la raison ajoutées ici. Les règles de chaque vague sont dans `RULES.md`, que Yann modifie directement.

## Origine

Le 29 octobre 2026, Emil Kowalski a montré son « interaction lab » ([tweet](https://x.com/emilkowalski/status/2115789995860517254)) : un système lui génère chaque jour de nouvelles interactions à partir de règles fixées à l'avance, il garde celles qu'il aime, et le labo reflète de plus en plus ses goûts. Sa vidéo (46 s, analysée image par image) montre douze cartes en deux colonnes, toutes sur le même modèle : un nom d'un mot, le geste écrit, une zone vivante, une ligne qui montre comment ça marche, un seul accent de couleur là où la main agit.

## Ce qu'on reprend et ce qui change

- Repris : la boucle (règles fixes, vague, tri, goût qui s'affine) et la grammaire des cartes.
- Changé, le contenu : des composants d'interface simples pensés de façon créative (bouton, interrupteur, curseur, champ, liste, menu, info-bulle, texte…), pas des simulations physiques. Raison : c'est ce que Yann apprend à construire, et une bonne idée peut ensuite devenir une expérience d'Experiments.
- Changé, l'apparence : celle d'Experiments (mêmes jetons de couleur, Inter Variable, deux thèmes), pas le noir, la monospace et la trame de points d'Emil. Raison : les deux labos doivent se lire comme le travail de la même personne.
- La ligne « how it works » donne les valeurs clés de l'effet (« spring 0.32 s · no overshoot »). Raison : Yann apprend en voyant comment chaque effet est réglé. Elle est en Inter à chiffres tabulaires, pas en monospace, parce que les étiquettes en monospace sont dans la liste des motifs à éviter.
- Les douze interactions d'Emil et leurs noms ne sont pas reproduits. Le README crédite le tweet.

## Un projet séparé d'Experiments

- Dossier `/Users/yann/AIOS/projects/interaction-lab`, son propre git, un futur dépôt public `ultrararebinary/interaction-lab` (MIT) et sa page GitHub Pages `https://ultrararebinary.github.io/interaction-lab/`.
- Raison : Experiments exige quatre fichiers par composant et tous les états vérifiés. Un labo qui produit des interactions brutes à chaque vague ne doit ni le ralentir ni abaisser son niveau. Une interaction que Yann adore peut devenir une vraie expérience par le processus normal d'Experiments (`NEW-EXPERIMENT.md`).
- Un lien depuis l'accueil d'Experiments s'ajoutera quand le labo sera publié, pas avant.
- Stack identique à Experiments : Vite, React, TypeScript, CSS simple. Ports 4330 (développement) et 4331 (prévisualisation), parce que 4318 à 4320 servent déjà à Experiments.

## Les avis : en local seulement

- Sur le serveur de développement, chaque carte a un panneau : Keep ou Drop (obligatoire), quatre étiquettes facultatives (idea, motion, look, feel) qui disent ce qui a pesé dans la décision, et une note libre. Un bouton Save écrit l'avis.
- Un plugin du serveur Vite (`plugins/lab.ts`) écrit chaque avis dans `.lab/feedback.json`. Pas de serveur en ligne, pas de compte. Raison : rien de personnel ne sort du Mac et il n'y a rien à héberger.
- Le site publié n'a pas le panneau : son code n'est chargé que si `import.meta.env.DEV` est vrai, et un contrôle après chaque build (`scripts/check-public.mjs`) échoue si une de ses phrases apparaît dans `dist/`.
- `.lab/` est ignoré par git. Il contient les avis bruts, le registre des idées (`ideas.json`), le profil de goûts privé (`TASTE.md`) et les captures. Ces fichiers n'existent que sur le Mac de Yann ; une sauvegarde du Mac les protège, pas GitHub.

## Ce qui est publié

- Seulement les interactions que lab-taste a marquées comme gardées, de la plus récente à la plus ancienne, chacune avec une phrase publique tirée de la note de Yann, à la première personne. Elles sont listées dans `kept.json`, seul fichier qui décide de la publication.
- Une page Taste (`content/taste.md`), réécrite par lab-taste.
- Tout le site est en anglais.
- Le build public ne contient que les cartes de `kept.json` : le plugin n'importe qu'elles. Raison : un filtre au moment de l'affichage laisserait le code des autres cartes dans les fichiers publiés.
- Le dépôt, lui, contient le code des cartes déjà commitées. D'où la règle de commit : lab-wave ne commite rien ; lab-taste propose un commit à la fin de sa lecture, avec seulement les cartes gardées, `kept.json`, la page Taste et la suppression des cartes jetées. Les cartes d'une vague pas encore lue restent hors des commits.

## Profil de goûts

- `TASTE.md` est le profil que lit lab-wave : goûts confirmés, pistes, ce que Yann rejette, directions à explorer. Il vit dans `.lab/`, en français. Raison : il cite les notes de Yann et la consigne de départ dit que seules la phrase publique de chaque carte gardée et la page Taste sont publiées. La page Taste en est la version publique, en anglais.
- Un goût est « confirmé » quand au moins deux cartes le montrent. Un seul exemple reste une piste.
- lab-taste présente sa lecture à Yann en français et attend ses corrections avant d'écrire quoi que ce soit.

## Une vague

- Six interactions, chacune en une seule version. Quatre s'appuient sur le profil de goûts et deux explorent des directions nouvelles, pour que le labo ne tourne pas en rond autour d'un seul style. Tant qu'aucun profil n'existe, les six explorent.
- Un sélecteur de deux ou trois variantes sert seulement quand l'idée dépend d'un réglage. Il vit dans la carte, sous la zone vivante, et change de variante sans animation. Raison : le sélecteur du skill `prototype` d'Emil est une pastille fixe en bas de l'écran, faite pour une seule chose à la fois ; avec six cartes, chacune a besoin du sien. On garde son principe (des noms qui décrivent la direction, un changement instantané).
- L'avis enregistre la variante affichée au moment du Save.
- À la fin d'une vague, Claude lance le site, l'ouvre dans le navigateur intégré, donne l'adresse locale à Yann et s'arrête.
- Les cartes jetées sont supprimées du code après la lecture de lab-taste. Leur trace reste dans `.lab/feedback.json` et `.lab/ideas.json`, pour que le labo reste léger et ne les régénère pas.

## Le cadre des cartes

- Grille de deux colonnes sur grand écran (cartes d'au moins 440 px), une seule en dessous. Colonne de page de 1088 px, la note d'accueil reste à environ 72 caractères par ligne comme dans Experiments.
- Carte : nom (graisse 550) et geste (gris) en haut ; zone vivante de 300 px de haut (280 px sous 600 px), coins de 12 px, anneau de 1 px, comme les zones d'Experiments ; ligne « how it works » en petit sous la zone ; date ou numéro de vague dessous. Une erreur dans une interaction s'affiche dans sa carte sans casser la page.
- Accent : un orange chaud, `oklch(0.72 0.17 45)` en sombre et `oklch(0.63 0.19 42)` en clair, dans la variable `--accent`. Choisi par Claude pour trancher sur les neutres chauds d'Experiments, qui n'a aucun accent ; Yann peut le changer. Le panneau d'avis n'utilise jamais l'accent, réservé aux interactions.
- Une interaction peut lire les jetons du labo (`--accent`, `--text`, `--muted`, `--control`, `--ring`, `--stage`) avec une valeur de secours, et rien d'autre du site.

## Vérification d'une vague

- `npm run check` (`scripts/check.mjs`) pilote Chrome sans dépendance, comme le script `readme.mjs` d'Experiments. Pour chaque carte : deux thèmes, avec et sans mouvement réduit, 390 et 1280 px, erreurs console, débordements, et un essai rapide à 390 px (clic, glisser, toucher). Il enregistre une capture par carte dans `.lab/shots/`. Raison : le navigateur intégré de Claude ne sait pas simuler le mouvement réduit, et ces contrôles se répètent à chaque vague.
- Il ne remplace pas l'essai du geste à la main ni la lecture du code de mouvement réduit.

## Vague 0 : carte d'essai

- Latch, un interrupteur dont le bouton retient juste avant le milieu, puis saute de l'autre côté. Elle sert à tester la boucle (panneau, fichier JSON, build public) et de modèle de dossier pour lab-wave.
- Statut `trial` dans `ideas.json` : lab-taste ne l'analyse pas et lab-wave ne la signale pas comme carte sans avis. Son avis de test (Drop, motion) a été donné pendant la mise en place.
