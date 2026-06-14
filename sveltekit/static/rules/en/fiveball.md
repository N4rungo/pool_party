# 🎱 5-Ball
> Reach exactly zero — like darts.

## 🎯 Objective
Start from a score (51, 101, 151…) and **count down to exactly zero** by scoring points through cannons. First to zero wins.

## 🎱 Setup
- **2 to 6 players**
- A French billiards variant
- Shared starting score (default **51**, in steps of 10, min 21), adjustable per player (handicap)
- **5 balls** on the table:

| Ball | Value |
|---|---|
| 🟢 Green | 1 |
| 🔴 Red | 2 |
| ⚪ White | 4 (cue ball) |
| 🟡 Yellow | 4 (cue ball) |
| 🔵 Blue | 6 |

- Initial **T layout**: blue in the centre, red at the top, green at the bottom, white to the left of the green, yellow to the right.
- **Cue ball alternates** each turn (white, yellow, white…). With 2 players, P1 always plays the white and P2 the yellow.

## ▶️ How to play
On your turn, you play your cue ball and must **cannon into at least 2 other balls**.
- ✅ **2 or more balls hit** → you score the **sum of their values**, deducted from your score.
- ❌ **1 or 0 balls** → no score, turn passes.
- 🎯 **Very first shot of the game (the break)**: you **must** hit the red first, or no score.

### 🚫 Bust: scores you can't close out
If after your shot the score you would have left is **1, 2 or 4**, your turn is **cancelled**: you score nothing and your score stays as it was.
Same if you **go negative**.

> 🤔 **Why?** Because you need at least 2 balls to score (minimum 1+2 = 3 points per shot), and every legal combination hits at least one ball worth 1 or 2 points. So it's impossible to close out a remaining score of 1, 2 or 4 in a single legal shot.

## 🏆 Winning
The first player to bring their score to **exactly zero** wins. 🥳

## 💡 Example — a perfect shot
Tom has 7 points left and plays the white. He hits the green (1) and the blue (6) → **−7** → score reaches zero → **game won**! 🏆

## 💡 Example — a bust
Léa has 5 points left. She hits the red (2) and the green (1) → −3 → would leave 2 → **bust**, her turn is cancelled, she stays at 5. Turn passes.
