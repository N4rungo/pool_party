function showLauncher() {
  document.getElementById('launcher').classList.remove('hidden');
  document.getElementById('gameChicago').classList.add('hidden');
  document.getElementById('casinGame').classList.add('hidden');
  document.getElementById('game').classList.add('hidden');
  ['overlayStep1', 'overlayStep2', 'overlayStep3',
    'overlayJoker', 'overlayTarget', 'overlayWin', 'overlayReplay'
  ].forEach(id => closeOverlay(id));
}

function launchGame(game) {
  if (game === 'killer') {
    document.getElementById('launcher').classList.add('hidden');
    document.getElementById('overlayStep1').classList.remove('hidden');
  } else if (game === 'chicago') {
    showChicagoSetup();
  } else if (game === 'casin') {
    document.getElementById('launcher').classList.add('hidden');
    document.getElementById('casinOverlayStep1').classList.remove('hidden');
    // Reset affichage step1
    document.getElementById('casinCountDisplay').textContent = casinSetup.count;
    document.getElementById('casinGlobalXDisplay').textContent = casinSetup.globalX;
  } else {
    showToast('🚧 Bientôt disponible !');
  }
}

(function init() {
  setJokerMode('random');
})();
