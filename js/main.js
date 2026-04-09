function showLauncher() {
  document.getElementById('launcher').classList.remove('hidden');
  document.getElementById('game').classList.add('hidden');
  document.getElementById('gameChicago').classList.add('hidden');
  document.getElementById('casinGame').classList.add('hidden');
  document.getElementById('ctGame').classList.add('hidden');
  [
    'overlayStep1', 'overlayStep2', 'overlayStep3',
    'casinOverlayStep1', 'casinOverlayStep2', 'casinOverlayStep3',
    'overlayCtStep1', 'overlayCtStep2', 'overlayCtTriangle',
    'overlayJoker', 'overlayTarget', 'overlayWin', 'overlayReplay',
    'overlayCtFault', 'overlayCtFaultResult', 'overlayCtWin'
  ].forEach(id => closeOverlay(id));
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
  } else {
    showToast('🚧 Bientôt disponible !');
  }
}

(function init() {
  setJokerMode('random');
})();
