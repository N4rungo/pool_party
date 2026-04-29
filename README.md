# 🎱 Pool Party

Application web de scoring pour différentes variantes de jeu de billard, pensée pour une soirée entre amis avec **un seul téléphone partagé**.

## 🚀 Lancer l'application

Aucune dépendance, aucun build : c'est du HTML/CSS/JS vanilla.

```bash
# Méthode 1 : ouvrir directement
open index.html

# Méthode 2 : via un petit serveur local (recommandé)
python3 -m http.server 8000
# puis http://localhost:8000
```

## 🎮 Jeux disponibles

| Jeu | Principe |
|---|---|
| **Killer** | Chaque joueur a des vies, perd une vie à chaque manque. Dernier survivant gagne. Mode jokers `random` ou `choice`. |
| **Cutthroat** | Trois groupes de billes, élimination progressive, dernier groupe avec billes restantes gagne. |
| **Chicago** | Premier à 61 points. |
| **14‑1 Continu** | Score cible par joueur, suivi des breaks. |
| **Casin** | Le français revisité, scoring matriciel par actions. |
| **Snooker** | Objectif 147 points, modes `simple` et `expert` (avec free ball). |

## 🗂️ Structure du projet

```
pool_party/
├── index.html              # Point d'entrée + tous les overlays
├── assets/                 # Images des billes et icônes
├── css/
│   ├── base.css            # Reset, body, design tokens (CSS variables)
│   ├── components.css      # Overlays, boutons, inputs, recap
│   └── <jeu>.css           # Styles spécifiques par jeu
└── js/
    ├── main.js             # Registre GAMES + showLauncher / launchGame
    ├── shared/
    │   ├── utils.js        # closeOverlay, showToast, bindEnterKey, shuffleArray
    │   └── playerSetup.js  # Helpers réutilisables pour la saisie de joueurs
    └── <jeu>/
        ├── constants.js
        ├── state.js        # <jeu>Setup et <jeu>State
        ├── setup.js        # <jeu>Launch() + écrans de configuration
        └── game.js         # Logique de partie
```

## 🎨 Design tokens

Couleurs centralisées en variables CSS dans `css/base.css` :

```css
:root {
  --color-gold:        #FFD700;
  --color-gold-light:  #FFE44D;
  --color-gold-dark:   #B8960C;
  --color-gold-rgb:    255, 215, 0;   /* pour les rgba */
  --color-pool:        #1a472a;
}
```

## ➕ Ajouter un nouveau jeu

1. Créer le dossier `js/mon-jeu/` avec `constants.js`, `state.js`, `setup.js`, `game.js`.
2. Dans `state.js`, déclarer les variables d'état préfixées : `monJeuSetup`, `monJeuState`.
3. Dans `setup.js`, exposer la fonction d'entrée :
   ```js
   function monJeuLaunch() {
     document.getElementById('launcher').classList.add('hidden');
     // afficher le premier overlay de configuration
   }
   ```
4. Ajouter une carte dans le launcher (`index.html`) :
   ```html
   <div class="game-card available" onclick="launchGame('monjeu')">
     <div class="game-icon">…</div>
     <div class="game-info">
       <div class="game-name">Mon Jeu</div>
       <div class="game-tagline">Tagline accrocheuse</div>
     </div>
     <div class="game-arrow">›</div>
   </div>
   ```
5. Ajouter l'écran de jeu (avec la classe `game-screen` !) et les overlays (avec la classe `overlay`) dans `index.html`. Cette classe garantit qu'ils sont masqués au retour à l'accueil sans config supplémentaire.
6. Charger les scripts dans `index.html` :
   ```html
   <script src="js/mon-jeu/constants.js"></script>
   <script src="js/mon-jeu/state.js"></script>
   <script src="js/mon-jeu/setup.js"></script>
   <script src="js/mon-jeu/game.js"></script>
   ```
7. Enregistrer le jeu dans `js/main.js` :
   ```js
   const GAMES = {
     // …
     monjeu: monJeuLaunch,
   };
   ```
8. Ajouter `css/mon-jeu.css` (et le lier dans `index.html`).

## 📐 Conventions

- **Variables d'état globales** : préfixées par l'identifiant du jeu (`killerSetup`, `chicagoState`, …).
- **Fonction d'entrée** : `<jeu>Launch()` (matche l'id passé à `launchGame`).
- **Écrans de jeu** : doivent porter la classe `game-screen` pour être masqués automatiquement.
- **Overlays** : doivent porter la classe `overlay`.
- **Helpers partagés** : dans `js/shared/`, jamais dans un module de jeu.
