# 🎱 Pool Party

Application web de scoring pour différentes variantes de billard, pensée pour **une soirée entre amis avec un seul téléphone partagé**.

Installable comme PWA sur Android et iOS — fonctionne hors ligne.

---

## 🎮 Jeux disponibles

### Billard américain
| Jeu | Principe |
|---|---|
| **Killer** | Chaque joueur a des vies — perd une vie à chaque manque. Dernier survivant gagne. |
| **Cutthroat** | Trois groupes de billes, élimination progressive. |
| **Chicago** | Premier à 61 points. |
| **Pool** | Pleines ou Rayées — empochez votre groupe puis la 8. |
| **9 Ball** | La 9 est votre seule cible ; ordre croissant obligatoire. |
| **10 Ball** | Même principe que le 9 Ball avec 10 billes. |
| **14-1 Continu** | Score cible par joueur, suivi des breaks. |

### Billard anglais
| Jeu | Principe |
|---|---|
| **Blackball** | Jaunes ou Rouges — empochez votre groupe puis la noire. |

### Billard français
| Jeu | Principe |
|---|---|
| **Carambole** | Touchez les deux billes adverses avec la bille blanche. |
| **Casin** | Le français revisité — scoring matriciel par actions. |

### Snooker
| Jeu | Principe |
|---|---|
| **Snooker** | Objectif 147 points. Modes simple et expert (avec free ball). |
| **5-Ball** | 5 billes, score à descendre à 0 pile. Logique fléchettes : bust à 1, 2 ou 4. |

---

## ✨ Fonctionnalités

- **Gestion des joueurs** — carnet persistant, réutilisable d'une partie à l'autre
- **Historique & statistiques** — suivi des parties par joueur et par jeu
- **Favoris** — épinglez vos jeux préférés en haut de la liste
- **Filtres** — filtrez par nombre de joueurs et type de table
- **Règles intégrées** — fiche de règles accessible depuis chaque jeu
- **7 thèmes de tapis** — vert, rouge, bleu, gris, violet, noir, camel
- **Bilingue FR / EN** — interface et règles disponibles en français et anglais
- **PWA** — installable sur l'écran d'accueil, fonctionne hors ligne

---

## 🛠️ Stack technique

- **SvelteKit** (Svelte 5) — framework front-end
- **svelte-i18n** — internationalisation (fichiers `src/lib/i18n/fr.json` / `en.json`)
- **localStorage** — persistance des joueurs, historique, favoris, thème et langue
- **Vite** + `@sveltejs/adapter-static` — build en site statique

---

## 🚀 Développement

```bash
cd sveltekit
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # génère le site statique dans build/
npm run preview    # prévisualise le build
```

---

## 🗂️ Structure

```
sveltekit/src/
├── app.css                        # Design tokens CSS (couleurs, thèmes)
├── lib/
│   ├── games.js                   # Registre des jeux (GAMES, CATEGORIES, TABLE_TYPES)
│   ├── games/                     # Logique métier par jeu (killer.js, pool.js, …)
│   ├── components/
│   │   ├── icons/                 # Icônes SVG de la barre de navigation
│   │   └── *.svelte               # Composants partagés (GameCard, Overlay, …)
│   ├── i18n/
│   │   ├── fr.json
│   │   └── en.json
│   └── stores/
│       ├── theme.js               # Thème actif + applyTheme()
│       ├── favorites.js           # Jeux favoris
│       ├── history.js             # Historique des parties
│       └── match.js               # Partie en cours
└── routes/
    ├── +layout.svelte             # Racine : init i18n + thème
    ├── (shell)/                   # Pages avec nav bar (accueil, joueurs, stats, réglages)
    │   ├── +layout.svelte
    │   ├── +page.svelte           # Launcher (liste des jeux)
    │   ├── players/
    │   ├── stats/
    │   └── settings/
    └── (games)/                   # Pages de jeu (sans nav bar)
        ├── killer/
        ├── pool/
        └── …
```

---

## ➕ Ajouter un jeu

1. Créer `src/lib/games/mon-jeu.js` avec la logique de partie.
2. Enregistrer le jeu dans `src/lib/games.js` (tableau `GAMES`) avec `id`, `name`, `tagline`, `category`, `minPlayers`, `maxPlayers`, `tableTypes`.
3. Créer la page `src/routes/(games)/mon-jeu/+page.svelte`.
4. Ajouter les clés i18n dans `fr.json` et `en.json`.
5. Ajouter les fichiers de règles `static/rules/fr/mon-jeu.md` et `static/rules/en/mon-jeu.md`.

---

## 🎨 Thèmes

Les thèmes sont définis dans `src/lib/stores/theme.js`. Chaque thème surcharge les CSS custom properties de `app.css` via `document.documentElement.style.setProperty()` :

```js
// Variables concernées
--color-pool          // fond principal (tapis)
--color-pool-mid      // fond intermédiaire (cards, overlays)
--color-pool-dark     // fond sombre (header, nav)
--color-pool-dark-rgb // variante RGB pour rgba()
--color-text-rgb      // texte (255,255,255 par défaut — inversé sur thème clair)
--color-gold          // couleur d'accent
--color-gold-rgb      // variante RGB pour rgba()
```
