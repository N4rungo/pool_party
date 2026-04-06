function showChicagoSetup() {
  document.getElementById('launcher').classList.add('hidden');
  document.getElementById('overlayChicagoSetup').classList.remove('hidden');
}

function startChicagoGame() {
  const inputs = document.querySelectorAll('.chicago-name-input');
  chicagoSetup.players = Array.from(inputs).map((inp, i) => ({
    name: inp.value.trim() || `Joueur ${i + 1}`,
  }));

  chicagoState.players = chicagoSetup.players.map(p => ({
    name: p.name,
    score: 0,
  }));
  chicagoState.currentIndex  = 0;
  chicagoState.pocketedBalls = new Set();
  chicagoState.history       = [];

  closeOverlay('overlayChicagoSetup');
  document.getElementById('gameChicago').classList.remove('hidden');
  renderChicagoGame();
}
