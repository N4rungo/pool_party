<!--
  PlayerPicker — sélection d'un joueur pour le setup d'une partie.

  • Profil existant : liste déroulante sur focus de la recherche
  • Créer un profil : nom → profil créé + sélectionné (un clic, pas de confirmation)
  • Invité           : nom libre, stats non sauvegardées (un clic, pas de confirmation)

  Props :
    value        : { name: string, profileId: string|null }  (bind:value)
    index        : number  (numéro du slot)
    exclude      : string[]  (profileIds déjà pris dans d'autres slots)
    excludeNames : string[]  (noms déjà pris — casse ignorée)
-->
<script>
  import { tick } from 'svelte';
  import { profilesStore, createProfile } from '$lib/stores/profiles.js';
  import { t } from 'svelte-i18n';

  export let value        = { name: '', profileId: null };
  export let index        = 0;
  export let exclude      = [];
  export let excludeNames = [];

  const MAX_NAME = 16;

  let mode       = 'idle'; // 'idle' | 'picking'
  let search     = '';
  let searchEl;

  // ── Dérivés ─────────────────────────────────────────────
  $: lowerExcludeNames = excludeNames.map(n => n.toLowerCase());
  $: trimmed           = search.trim();
  $: lowerTrimmed      = trimmed.toLowerCase();

  $: availableProfiles = $profilesStore.filter(p =>
    !exclude.includes(p.id) &&
    !lowerExcludeNames.includes(p.name.toLowerCase()) &&
    p.name.toLowerCase().includes(lowerTrimmed)
  );

  // Nom déjà pris dans la partie (autre slot)
  $: takenInGame = !!trimmed && lowerExcludeNames.includes(lowerTrimmed);

  // Nom correspond à un profil existant dans le store
  $: matchesProfile = !!trimmed &&
    $profilesStore.some(p => p.name.toLowerCase() === lowerTrimmed);

  // Bouton Invité : bloqué si vide, pris dans la partie, ou correspond à un profil
  $: guestBlocked = !trimmed || takenInGame || matchesProfile;

  // Bouton Créer profil : bloqué si vide, pris dans la partie, ou profil déjà existant
  $: createBlocked = !trimmed || takenInGame || matchesProfile;

  // Message d'erreur contextuel sous les boutons
  $: hintMsg = (() => {
    if (!trimmed) return '';
    if (takenInGame)    return $t('picker.nameTaken');
    if (matchesProfile) return $t('picker.nameIsProfile');
    return '';
  })();

  // ── Blur avec délai pour laisser les clics sur la liste se déclencher
  let blurTimer;
  function onSearchFocus() {
    clearTimeout(blurTimer);
    mode = 'picking';
  }
  function onSearchBlur() {
    blurTimer = setTimeout(() => {
      if (mode === 'picking') mode = 'idle';
    }, 180);
  }

  // ── Actions ─────────────────────────────────────────────
  function selectProfile(profile) {
    value  = { name: profile.name, profileId: profile.id };
    mode   = 'idle';
    search = '';
  }

  function addGuest() {
    if (guestBlocked) return;
    value  = { name: trimmed, profileId: null };
    mode   = 'idle';
    search = '';
  }

  function addNewProfile() {
    if (createBlocked) return;
    const profile = createProfile(trimmed);
    value  = { name: profile.name, profileId: profile.id };
    mode   = 'idle';
    search = '';
  }

  async function startEdit() {
    search = value.name;
    value  = { name: '', profileId: null };
    mode   = 'idle';
    await tick();
    if (searchEl) {
      searchEl.focus();
      searchEl.setSelectionRange(search.length, search.length);
    }
  }

  function clear() {
    value  = { name: '', profileId: null };
    search = '';
    mode   = 'idle';
  }
</script>

<div class="player-picker">

  <!-- ── Joueur sélectionné ── -->
  {#if mode === 'idle' && value.name}
    <div class="selected-row">
      <div class="selected-info">
        <span class="player-num">{$t('picker.playerShort')}{index + 1}</span>
        <span class="player-name">{value.name}</span>
        {#if value.profileId}
          <span class="badge-profile">💾</span>
        {:else}
          <span class="badge-guest">{$t('picker.guest')}</span>
        {/if}
      </div>
      <button class="btn-change" on:click={startEdit}>✎</button>
    </div>

  <!-- ── Recherche / sélection ── -->
  {:else}
    <div class="picker-header">
      <span class="player-num">{$t('picker.playerShort')}{index + 1}</span>
      <span class="picker-label">{$t('picker.choose')}</span>
    </div>

    <input
      class="search-input"
      type="text"
      placeholder={$t('setup.searchOrType')}
      maxlength={MAX_NAME}
      bind:value={search}
      bind:this={searchEl}
      on:focus={onSearchFocus}
      on:blur={onSearchBlur}
      on:keydown={e => { if (e.key === 'Enter' && !guestBlocked) addGuest(); }}
    />

    <!-- Liste déroulante — visible seulement quand focused -->
    {#if mode === 'picking'}
      <div class="profile-list">
        {#if availableProfiles.length > 0}
          {#each availableProfiles as profile}
            <button class="profile-item" on:mousedown|preventDefault={() => selectProfile(profile)}>
              <span class="profile-item-name">{profile.name}</span>
              <span class="profile-item-badge">💾</span>
            </button>
          {/each}
        {:else if search && !matchesProfile}
          <div class="empty-hint">{$t('picker.noProfile', { values: { name: search } })}</div>
        {:else if !search}
          <div class="empty-hint">
            {$profilesStore.length === 0 ? $t('picker.noProfiles') : $t('picker.allSelected')}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Actions -->
    <div class="actions-row">
      <button
        class="btn-action"
        disabled={createBlocked}
        on:mousedown|preventDefault={addNewProfile}
      >
        {$t('picker.createProfile')}
      </button>
      <button
        class="btn-action btn-guest"
        disabled={guestBlocked}
        on:mousedown|preventDefault={addGuest}
      >
        {$t('picker.guest')}
      </button>
    </div>

    {#if hintMsg}
      <div class="hint">{hintMsg}</div>
    {/if}
  {/if}

</div>

<style>
  .player-picker {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── Joueur sélectionné ── */
  .selected-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .selected-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .player-num {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 1px;
    flex-shrink: 0;
  }

  .player-name {
    font-size: 17px;
    font-weight: bold;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge-profile,
  .badge-guest {
    flex-shrink: 0;
    border-radius: 20px;
    line-height: 1;
  }

  .badge-profile {
    font-size: 11px;
    padding: 3px 8px;
    background: rgba(var(--color-gold-rgb), 0.12);
    border: 1px solid rgba(var(--color-gold-rgb), 0.3);
  }

  .badge-guest {
    font-size: 10px;
    padding: 2px 7px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.45);
  }

  .btn-change {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.5);
    padding: 6px 10px;
    font-size: 14px;
    cursor: pointer;
    flex-shrink: 0;
  }

  /* ── Header ── */
  .picker-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .picker-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Input de recherche ── */
  .search-input {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    color: white;
    font-size: 15px;
    padding: 9px 12px;
    outline: none;
    transition: border-color 0.15s;
  }

  .search-input:focus {
    border-color: rgba(var(--color-gold-rgb), 0.4);
    background: rgba(255, 255, 255, 0.08);
  }

  .search-input::placeholder { color: rgba(255, 255, 255, 0.25); }

  /* ── Liste déroulante ── */
  .profile-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 180px;
    overflow-y: auto;
  }

  .profile-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 9px;
    padding: 9px 12px;
    cursor: pointer;
    color: white;
    font-size: 14px;
    text-align: left;
  }

  .profile-item:active {
    background: rgba(var(--color-gold-rgb), 0.1);
    border-color: rgba(var(--color-gold-rgb), 0.3);
  }

  .profile-item-name { flex: 1; }
  .profile-item-badge { font-size: 12px; color: rgba(255, 255, 255, 0.35); }

  .empty-hint {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.3);
    text-align: center;
    padding: 8px 0;
  }

  /* ── Actions ── */
  .actions-row {
    display: flex;
    gap: 8px;
  }

  .btn-action {
    flex: 1;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.65);
    font-size: 13px;
    padding: 8px 10px;
    cursor: pointer;
    text-align: center;
    font-family: inherit;
    transition: background 0.12s, opacity 0.12s;
  }

  .btn-action:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .btn-guest { color: rgba(255, 255, 255, 0.45); }

  /* ── Hint contextuel ── */
  .hint {
    font-size: 12px;
    color: rgba(255, 180, 80, 0.85);
    padding: 0 2px;
  }
</style>
