/**
 * Store et helper pour les boîtes de dialogue de confirmation.
 *
 * Remplace `confirm()` natif (popup système moche, casse l'esthétique)
 * par un Overlay stylé cohérent avec le reste de l'app.
 *
 * Usage depuis n'importe quel composant :
 *
 *   import { askConfirm } from '$lib/stores/confirm.js';
 *
 *   if (await askConfirm("Abandonner la partie ?")) {
 *     goto('/');
 *   }
 *
 * Le composant ConfirmDialog (monté dans +layout.svelte) écoute le store
 * et affiche le dialog quand un appel est en cours.
 */
import { writable } from 'svelte/store';

// State courant : null si pas de dialog actif, sinon { message, confirmLabel, cancelLabel, resolve }
export const confirmState = writable(null);

/**
 * Affiche un dialog de confirmation et renvoie une Promise<boolean>.
 * Résout `true` si l'utilisateur confirme, `false` sinon.
 *
 * Options :
 *   - confirmLabel : texte du bouton de confirmation (défaut 'Confirmer')
 *   - cancelLabel  : texte du bouton d'annulation  (défaut 'Annuler')
 *   - icon         : emoji ou caractère affiché en haut du dialog (défaut '⚠️')
 *   - iconImage    : chemin d'image (ex. '/assets/home.png') ; override `icon`
 */
export function askConfirm(message, options = {}) {
  const {
    confirmLabel = 'Confirmer',
    cancelLabel  = 'Annuler',
    icon         = '⚠️',
    iconImage    = null,
  } = options;

  return new Promise((resolve) => {
    confirmState.set({ message, confirmLabel, cancelLabel, icon, iconImage, resolve });
  });
}

/**
 * Appelé par le composant ConfirmDialog pour répondre à la promesse en cours.
 * `result` est true si confirmé, false sinon.
 */
export function _resolveConfirm(result) {
  confirmState.update(state => {
    if (state) state.resolve(result);
    return null;
  });
}
