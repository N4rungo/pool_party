function closeOverlay(id) {
  document.getElementById(id).classList.add('hidden');
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[r]] = [arr[r], arr[i]];
  }
}

function showToast(msg) {
  const old = document.getElementById('toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Palette billard
function billeIcon(playerIndex) {
  // playerIndex : 0-based (joueur 1 = index 0 → bille 1)
  const billeNum = playerIndex + 1; // bille 1 à 8 max
  
  // Position dans la grille (bille 0 = blanche, bille 1 à col 1 row 0, etc.)
  const col = billeNum % 4;       // colonne 0-3
  const row = Math.floor(billeNum / 4); // ligne 0-3
  
  const spriteSize = 1024; // taille totale du sprite
  const cellSize = 256;    // taille d'une bille dans le sprite
  const displaySize = 36;  // taille affichée en px
  const ratio = displaySize / cellSize;

  const bgX = -(col * cellSize * ratio);
  const bgY = -(row * cellSize * ratio);
  const bgSize = spriteSize * ratio; // = 144px

  return `<span style="
    display: inline-block;
    width: ${displaySize}px;
    height: ${displaySize}px;
    background-image: url('assets/billes.png');
    background-size: ${bgSize}px ${bgSize}px;
    background-position: ${bgX}px ${bgY}px;
    background-repeat: no-repeat;
    vertical-align: middle;
    flex-shrink: 0;
  " aria-label="Bille ${billeNum}"></span>`;
}
