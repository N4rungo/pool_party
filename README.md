# 🎱 Pool Party

Application web de jeux de billard en mode soirée, jouable sur mobile.

## 🚀 Lancer l'application

Ouvrir `index.html` dans un navigateur, ou via GitHub Pages :
👉 [https://ton-pseudo.github.io/pool-party](https://ton-pseudo.github.io/pool-party)

---

## 🗂️ Structure du projet
``` 
pool-party/
├── index.html          # Structure HTML + point d'entrée
├── css/
│   ├── base.css        # Reset, body, toast
│   └── components.css  # Tous les composants UI
├── js/
│   ├── main.js         # Init, launcher, navigation
│   ├── state.js        # Constantes et état global
│   ├── setup.js        # Configuration de la partie (étapes 1-3)
│   ├── game.js         # Déroulement du jeu Killer
│   └── utils.js        # Fonctions utilitaires (shuffle, toast…)
└── README.md
```
---

## 🎮 Jeux disponibles

### Killer Billard
Chaque joueur commence avec un nombre de vies configurable.  
À son tour, il doit rentrer une bille. S'il rate, il perd une vie.  
Le dernier survivant gagne.

**Modes joker :**
- `random` — pioche dans un pool commun
- `choice` — chaque joueur a 3 jokers prédéfinis

---

## ➕ Ajouter un nouveau jeu

1. Ajouter un bouton dans le launcher (`index.html`) :
```html
<button onclick="launchGame('mon-jeu')">🎯 Mon Jeu</button>
```

2. Gérer le cas dans main.js :

```
function launchGame(game) {
  if (game === 'killer') { ... }
  else if (game === 'mon-jeu') {
    // afficher le premier overlay de configuration
  }
}
```

3. Créer js/mon-jeu/ avec state.js, setup.js, game.js

4. Ajouter les styles dans css/components.css ou un nouveau fichier CSS dédié