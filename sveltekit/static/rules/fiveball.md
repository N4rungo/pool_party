# 🎱 5-Ball
> Atteignez 0 pile, comme aux fléchettes.

## 🎯 But du jeu
Partir d'un score (51, 101, 151…) et **descendre à 0 pile** en marquant des points par carambolage. Le premier à zéro gagne.

## 🎱 Mise en place
- **2 à 6 joueurs**
- Variante du billard français 
- Score de départ commun (par défaut **51**, par pas de 10, min 21), ajustable individuellement (handicap)
- **5 billes** sur la table :

| Bille | Valeur |
|---|---|
| 🟢 Verte | 1 |
| 🔴 Rouge | 2 |
| ⚪ Blanche | 4 (cue ball) |
| 🟡 Jaune | 4 (cue ball) |
| 🔵 Bleue | 6 |

- Disposition initiale en **T** : la bleue au centre, la rouge en haut, la verte en bas, la blanche à gauche de la verte, la jaune à droite.
- **Cue ball alternée** à chaque tour (blanche, jaune, blanche…). À 2 joueurs, J1 garde donc la blanche et J2 la jaune.

## ▶️ Comment jouer
À votre tour, vous jouez votre cue ball et devez **caramboler au moins 2 autres billes**.
- ✅ **2 billes ou plus touchées** → vous marquez la **somme de leurs valeurs**, qui est retirée à votre score.
- ❌ **1 ou 0 bille** → faute, vous ne marquez rien, la main passe.
- 🎯 **Tout premier coup de la partie (l'engagement)** : vous **devez** toucher la rouge en premier, sinon faute.

### 🚫 Bust : les scores impossibles à clore
Si après votre coup, le score qu'il vous resterait est **1, 2 ou 4**, votre tour est **annulé** : vous ne marquez pas et votre score reste celui d'avant.
Pareil si vous **passez en négatif**.

> 🤔 **Pourquoi ?** Parce qu'il faut au moins 2 billes pour scorer (donc minimum 1+2 = 3 points par coup), et toute combinaison touche au moins une bille à 1 ou 2 points. Du coup, il est impossible de clore un score restant de 1, 2 ou 4 en un seul coup légal.

## 🏆 Victoire
Le premier joueur qui descend son score à **0 pile** remporte la partie. 🥳

## 💡 Exemple — un coup parfait
Tom est à 7 points restants et joue la blanche. Il touche la verte (1) et la bleue (6) → **−7** → reste 0 pile → **partie gagnée** ! 🏆

## 💡 Exemple — un bust
Léa est à 5 points restants. Elle touche la rouge (2) et la verte (1) → −3 → resterait 2 → **bust**, son tour est annulé, elle reste à 5. La main passe.
