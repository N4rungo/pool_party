# 🎱 Pool Party — version SvelteKit (en migration)

Réécriture progressive de Pool Party en [SvelteKit](https://kit.svelte.dev/), conformément à la **phase 3** de la roadmap. Cette version cohabite avec la version vanilla (à la racine du repo) tant que tous les jeux ne sont pas portés.

## 🚀 Lancer en local

### Pré-requis (une fois)
- [Node.js](https://nodejs.org/en) 18+ recommandé (LTS).

### Installation
```bash
cd sveltekit
npm install
```

### Dev (hot reload)
```bash
npm run dev
```
Puis ouvre http://localhost:5173/.

Toute modif d'un fichier `.svelte` / `.js` / `.css` provoque un re-render automatique du navigateur.

### Build production
```bash
npm run build      # génère le site statique dans build/
npm run preview    # sert le build local pour vérification
```

## 🗂️ Architecture

```
sveltekit/
├── package.json              # dépendances + scripts npm
├── svelte.config.js          # config SvelteKit (adapter-static)
├── vite.config.js            # serveur de dev
├── jsconfig.json             # aide IDE (autocomplétion JS/Svelte)
├── src/
│   ├── app.html              # shell HTML minimal
│   ├── app.css               # design tokens (variables CSS), reset, boutons génériques
│   ├── routes/
│   │   ├── +layout.svelte    # layout global, importe app.css
│   │   ├── +page.svelte      # launcher (URL: /)
│   │   ├── killer/+page.svelte
│   │   ├── cutthroat/+page.svelte
│   │   ├── chicago/+page.svelte
│   │   ├── straightpool/+page.svelte
│   │   ├── casin/+page.svelte
│   │   ├── snooker/+page.svelte
│   │   └── fiveball/+page.svelte
│   └── lib/
│       ├── games.js          # registre central des jeux
│       └── components/
│           ├── GameCard.svelte    # carte de jeu sur le launcher
│           ├── GameStub.svelte    # placeholder pour les jeux pas encore migrés
│           ├── Overlay.svelte     # overlay générique avec backdrop + close
│           └── RulesViewer.svelte # affichage des règles markdown dans un Overlay
└── static/
    ├── assets/  # images des billes, icônes (copiées depuis ../assets)
    └── rules/   # règles markdown (copiées depuis ../rules)
```

## 🎮 État de la migration

| Jeu | Statut |
|---|---|
| Launcher | ✅ porté |
| Killer | 🚧 stub |
| Cutthroat | 🚧 stub |
| Chicago | 🚧 stub (prochain) |
| 14-1 Continu | 🚧 stub |
| Casin | 🚧 stub |
| Snooker | 🚧 stub |
| 5-Ball | 🚧 stub |

Les fichiers `static/assets/` et `static/rules/` sont des copies des dossiers à la racine. Quand la migration sera terminée, on les supprimera de la racine.

## ➕ Ajouter / migrer un jeu

1. Ajoute (ou vérifie) l'entrée dans `src/lib/games.js`.
2. Crée la route `src/routes/<gameId>/+page.svelte`.
3. Crée la logique métier dans `src/lib/games/<gameId>.js` si besoin.
4. Référence les assets via `/assets/...` et les règles via `/rules/...` (servies depuis `static/`).
