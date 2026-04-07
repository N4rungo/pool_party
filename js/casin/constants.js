const CASIN_ACTIONS = [
  { id: 'direct',      icon: '🎯', label: 'Direct',      desc: 'Toucher les 2 billes sans toucher de bande' },
  { id: 'libre',       icon: '🔓', label: 'Libre',       desc: 'Aucune restriction' },
  { id: 'rouge',       icon: '🔴', label: 'Rouge',       desc: 'Toucher la bille rouge en premier' },
  { id: 'bande1',      icon: '1️⃣', label: '1 bande',     desc: '1 bande avant de toucher la 2e bille' },
  { id: 'bande2',      icon: '2️⃣', label: '2 bandes',    desc: '2 bandes avant de toucher la 2e bille' },
  { id: 'bande3',      icon: '3️⃣', label: '3 bandes',    desc: '3 bandes ou + avant de toucher la 2e bille' },
  { id: 'bande_avant', icon: '↩️', label: 'Bande avant', desc: 'Au moins 1 bande avant de toucher les 2 billes' },
  { id: 'main_gauche', icon: '✋', label: 'Main gauche',  desc: 'Coup légal avec la main non dominante' },
  { id: 'casin',       icon: '🌀', label: 'Casin',       desc: 'Toucher la rouge qui touche la 2e bille via au moins 1 bande' },
];

const CASIN_MAX_PLAYERS = 6;
const CASIN_MIN_PLAYERS = 2;
const CASIN_DEFAULT_X   = 2;
const CASIN_MIN_X       = 1;
const CASIN_MAX_X       = 5;
