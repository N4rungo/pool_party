function showLauncher() {
  document.getElementById('launcher').classList.remove('hidden');
  document.querySelectorAll('.game-screen').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
}


function launchGame(game) {
  if (game === 'killer') {
    document.getElementById('launcher').classList.add('hidden');
    document.getElementById('overlayStep1').classList.remove('hidden');
  } else if (game === 'chicago') {
    showChicagoSetup();
  } else if (game === 'casin') {
    showCasinSetup();
  } else if (game == 'cutthroat') {
    ctLaunchGame();
  } else if (game === 'snooker') {
    snookerLaunchGame();
  } else if (game === 'straightpool') {
    spShowSetup();
  } else {
    showToast('🚧 Bientôt disponible !');
  }
}

function confirmGoHome() {
  if (confirm('Abandonner la partie et revenir à l\'accueil ?')) {
    showLauncher();
  }
}


(function init() {
  setJokerMode('random');
})();
