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
const BILLE_COLORS = [
  { color: '#F5C518', num: 1  },  // jaune
  { color: '#2980e8', num: 2  },  // bleu
  { color: '#e74c3c', num: 3  },  // rouge
  { color: '#8e44ad', num: 4  },  // violet
  { color: '#e67e22', num: 5  },  // orange
  { color: '#27ae60', num: 6  },  // vert
  { color: '#8B2500', num: 7  },  // bordeaux
  { color: '#111111', num: 8  },  // noire
];

function billeIcon(playerIndex, size = 32) {
  const { color, num } = BILLE_COLORS[playerIndex % BILLE_COLORS.length];
  const id = `bg_${playerIndex}`;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="${id}" cx="38%" cy="35%" r="60%">
          <stop offset="0%"   stop-color="white" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="${color}"/>
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#${id})" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="7" fill="white" fill-opacity="0.85"/>
      <text x="16" y="20.5" text-anchor="middle" font-size="8.5"
            font-weight="bold" font-family="Arial, sans-serif"
            fill="${color}">${num}</text>
    </svg>`;
}