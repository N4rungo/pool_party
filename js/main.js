function showLauncher() {
  document.getElementById('launcher').classList.remove('hidden');
  document.getElementById('game').classList.add('hidden');
  ['overlayStep1','overlayStep2','overlayStep3',
   'overlayJoker','overlayTarget','overlayWin','overlayReplay'
  ].forEach(id => closeOverlay(id));
}

function launchGame(game) {
  if (game === 'killer') {
    document.getElementById('launcher').classList.add('hidden');
    document.getElementById('overlayStep1').classList.remove('hidden');
  } else {
    showToast('🚧 Bientôt disponible !');
  }
}

(function init() {
  setJokerMode('random');
})();
