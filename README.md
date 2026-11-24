# Palet Club — Match Generator

Application Angular locale pour tirer au sort les rencontres de palet en double.

## Lancer dans WebStorm

Ouvrir ce dossier, puis utiliser le terminal intégré :

```sh
npm install
npm start
```

Ouvrir http://localhost:4200. On peut aussi lancer le script `start` depuis `package.json` dans WebStorm.

## Utilisation

1. Les 49 membres du club sont préchargés depuis `src/app/club-members.ts`, sous la forme « Prénom Nom ». La liste est triée par prénom, puis par nom, selon l’ordre alphabétique français (sans distinguer les accents et les majuscules).
2. Cliquer sur les membres présents. « Tout » sélectionne l’intégralité du club, même si la recherche filtre la liste.
3. Générer le tirage : le nombre de planches est calculé automatiquement, sans réglage. Chaque groupe de quatre forme un double. S’il reste deux ou trois joueurs, une planche supplémentaire accueille un simple (un contre un).
4. Le mode projection masque la préparation et remplit l’écran sans défilement. La grille adapte ses colonnes et ses lignes à la surface disponible ; quatre planches occupent une grille 2 × 2. La dernière ligne remplit aussi toute la largeur. Les noms sur les planches sont abrégés en « Prénom N. », avec les prénoms composés conservés. La sélection conserve les noms complets. Quitter avec le bouton « Quitter la projection ». Échap quitte le plein écran du navigateur, sans quitter la disposition projection.
5. Le formulaire visible dans la liste permet d’ajouter un membre à la fois (prénom, avec nom facultatif). Le nouveau membre est automatiquement sélectionné pour le prochain tirage.

4 joueurs = 1 planche ; 12 = 3 ; 60 = 15. 6 joueurs = un double et un simple ; 7 joueurs = un double, un simple et une personne en attente. Il ne reste jamais plus d’un joueur en attente. Le tirage peut démarrer dès deux joueurs. Chaque nouveau tirage mélange tous les joueurs sélectionnés ; il n’existe pas encore de priorité pour les joueurs en attente ni de prévention des partenaires répétés.

La sélection peut évoluer sans effacer la manche affichée. Un avertissement invite à générer le prochain tirage. Les prénoms du tirage sont des instantanés.

## Données

La liste et la sélection sont enregistrées dans `localStorage` sur ce navigateur et cette adresse. Le tirage est conservé uniquement pendant l’ouverture de la page. Aucun compte, serveur de données ou synchronisation entre appareils. Les ajouts et suppressions restent possibles et sont conservés dans ce navigateur. Effacer ses données recharge la liste de base des 49 membres. Le stockage `v2` remplace l’ancienne démonstration à l’écran sans supprimer son ancien stockage `v1`. Pour les ajouts, saisir « Prénom Nom » afin de conserver le tri. Soen est conservé sans nom de famille, tel que fourni.

## Choix techniques

- Angular 22, composants autonomes, TypeScript strict : cadre demandé, typage des membres et rencontres, peu de configuration.
- Signals et valeurs calculées : sélection et compteurs synchronisés sans ajouter de gestionnaire d’état.
- Fonction pure `createDraw` avec Fisher–Yates : mélange uniforme, sans doublons, indépendant de l’interface et testable. `Math.random` convient au tirage informel du club, sans valeur de loterie réglementée.
- CSS Grid et viewport `vh`/`vw` (`dvh` pour la hauteur dynamique) : projection fixe à la taille de l’écran, lignes de même hauteur et cartes extensibles. Un `ResizeObserver` mesure l’espace réellement disponible, y compris après un redimensionnement. Les unités de conteneur `cqw`/`cqh` ajustent les éléments à chaque carte. Une directive dédiée mesure les noms avec leur police réelle et cherche la plus grande taille qui tient dans la carte, avec deux lignes maximum par joueur. Les coupures se font aux espaces et aux tirets. Le calcul est relancé après un changement de taille, un nouveau tirage ou le chargement des polices.
- CSS natif : pas de bibliothèque d’interface supplémentaire pour cet écran unique.
- `localStorage` : persistance simple pour un ordinateur de club, avec message si le stockage est indisponible.
- Pas de routage ni de serveur : une seule page interactive suffit pour ce premier jet.
- Polices Google Fonts facultatives ; les polices système prennent le relais sans connexion.

## Vérifier

```sh
npm test
npm run build
```

Les tests vérifient plusieurs effectifs jusqu’à 100 joueurs, les duos, les restants, les doublons, l’absence de mutation et l’identité des homonymes.

Node 24.20.0 et npm 11.19.0 utilisés pour la mise en place. Les versions exactes des dépendances sont conservées dans `package-lock.json`.
