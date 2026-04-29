// Registre des jeux : id (utilisé par launchGame) -> fonction d'entrée
const GAMES = {
  killer:       killerLaunch,
  cutthroat:    cutthroatLaunch,
  chicago:      chicagoLaunch,
  straightpool: straightpoolLaunch,
  casin:        casinLaunch,
  snooker:      snookerLaunch,
  fiveball:     fiveBallLaunch,
};


function showLauncher() {
  document.getElementById('launcher').classList.remove('hidden');
  document.querySelectorAll('.game-screen').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
}


function launchGame(gameId) {
  const launch = GAMES[gameId];
  if (typeof launch !== 'function') {
    showToast('🚧 Bientôt disponible !');
    return;
  }
  launch();
}


function confirmGoHome() {
  if (confirm('Abandonner la partie et revenir à l\'accueil ?')) {
    showLauncher();
  }
}


(function init() {
  setJokerMode('random');
})();
