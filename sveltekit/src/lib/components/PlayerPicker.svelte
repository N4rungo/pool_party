<!--
  PlayerPicker — sélection d'un joueur pour le setup d'une partie.

  • Profil existant : liste déroulante sur focus de la recherche
  • Créer un profil : nom → profil créé + sélectionné
  • Invité           : nom libre, stats non sauvegardées

  Props :
    value        : { name: string, profileId: string|null }  (bind:value)
    index        : number  (numéro du slot)
    exclude      : string[]  (profileIds déjà pris dans d'autres slots)
    excludeNames : string[]  (noms déjà pris — casse ignorée)
-->
<script>
  import { profilesStore, createProfile } from '$lib/stores/profiles.js';

  export let value        = { name: '', profileId: null };
  export let index        = 0;
  export let exclude      = [];
  export let excludeNames = [];

  const MAX_NAME = 16;

  // États : 'idle' | 'picking' | 'guest' | 'creating'
  let mode = value.profileId || value.name ? 'idle' : 'idle';

  let search    = '';
  let newName   = '';
  let guestName = '';

  // ── Dérivés ─────────────────────────────────────────────
  $: lowerExcludeNames = excludeNames.map(n => n.toLowerCase());

  $: availableProfiles = $profilesStore.filter(p =>
    !exclude.includes(p.id) &&
    !lowerExcludeNames.includes(p.name.toLowerCase()) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  $: guestNameTaken  = !!guestName.trim() &&
    lowerExcludeNames.includes(guestName.trim().toLowerCase());

  $: newNameExists   = !!newName.trim() &&
    $profilesStore.some(p => p.name.toLowerCase() === newName.trim().toLowerCase());
  $: newNameTaken    = !!newName.trim() &&
    lowerExcludeNames.includes(newName.trim().toLowerCase());
  $: newNameBlocked  = newNameExists || newNameTaken;

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
    value = { name: profile.name, profileId: profile.id };
    mode  = 'idle';
    search = '';
  }

  function confirmGuest() {
    const name = guestName.trim();
    if (!name || guestNameTaken) return;
    value = { name, profileId: null };
    mode  = 'idle';
  }

  function confirmCreate() {
    const name = newName.trim();
    if (!name || newNameBlocked) return;
    const profile = createProfile(name);
    value = { name: profile.name, profileId: profile.id };
    mode  = 'idle';
    newName = '';
  }

  function clear() {
    value     = { name: '', profileId: null };
    guestName = '';
    search    = '';
    newName   = '';
    mode      = 'idle';
  }
</script>

<div class="player-picker">

  <!-- ── Joueur sélectionné ── -->
  {#if (mode === 'idle') && value.name}
    <div class="selected-row">
      <div class="selected-info">
        <span class="player-num">J{index + 1}</span>
        <span class="player-name">{value.name}</span>
        {#if value.profileId}
          <span class="badge-profile">profil</span>
        {:else}
          <span class="badge-guest">invité</span>
        {/if}
      </div>
      <button class="btn-change" on:click={clear}>✎</button>
    </div>

  <!-- ── Formulaire invité ── -->
  {:else if mode === 'guest'}
    <div class="picker-header">
      <span class="player-num">J{index + 1}</span>
      <span class="picker-label">Jouer en invité</span>
    </div>
    <div class="inline-form">
      <input
        class="search-input"
        class:input-error={guestNameTaken}
        type="text"
        placeholder="Pseudo de l'invité…"
        maxlength={MAX_NAME}
        bind:value={guestName}
        on:keydown={e => e.key === 'Enter' && confirmGuest()}
        autofocus
      />
      {#if guestNameTaken}
        <div class="error-hint">Ce pseudo est déjà utilisé dans cette partie</div>
      {/if}
      <div class="inline-actions">
        <button class="btn-action" on:click={() => { mode = 'idle'; guestName = ''; }}>← Retour</button>
        <button class="btn-confirm" on:click={confirmGuest}
                disabled={!guestName.trim() || guestNameTaken}>
          Confirmer
        </button>
      </div>
    </div>

  <!-- ── Formulaire création ── -->
  {:else if mode === 'creating'}
    <div class="picker-header">
      <span class="player-num">J{index + 1}</span>
      <span class="picker-label">Nouveau profil</span>
    </div>
    <div class="inline-form">
      <input
        class="search-input"
        class:input-error={newNameBlocked}
        type="text"
        placeholder="Nom du profil…"
        maxlength={MAX_NAME}
        bind:value={newName}
        on:keydown={e => e.key === 'Enter' && confirmCreate()}
        autofocus
      />
      {#if newNameTaken}
        <div class="error-hint">Ce nom est déjà utilisé dans cette partie</div>
      {:else if newNameExists}
        <div class="error-hint">Un profil avec ce nom existe déjà</div>
      {/if}
      <div class="inline-actions">
        <button class="btn-action" on:click={() => { mode = 'idle'; newName = ''; }}>← Retour</button>
        <button class="btn-confirm" on:click={confirmCreate}
                disabled={!newName.trim() || newNameBlocked}>
          Créer et sélectionner
        </button>
      </div>
    </div>

  <!-- ── Recherche / sélection profil ── -->
  {:else}
    <div class="picker-header">
      <span class="player-num">J{index + 1}</span>
      <span class="picker-label">Choisir le joueur</span>
    </div>

    <input
      class="search-input"
      type="text"
      placeholder="Rechercher un profil…"
      maxlength={MAX_NAME}
      bind:value={search}
      on:focus={onSearchFocus}
      on:blur={onSearchBlur}
    />

    <!-- Liste déroulante — visible seulement quand focused -->
    {#if mode === 'picking'}
      <div class="profile-list">
        {#if availableProfiles.length > 0}
          {#each availableProfiles as profile}
            <button class="profile-item" on:mousedown|preventDefault={() => selectProfile(profile)}>
              <span class="profile-item-name">{profile.name}</span>
              <span class="profile-item-arrow">→</span>
            </button>
          {/each}
        {:else if search}
          <div class="empty-hint">Aucun profil pour « {search} »</div>
        {:else}
          <div class="empty-hint">
            {$profilesStore.length === 0 ? 'Aucun profil enregistré' : 'Tous les profils sont déjà sélectionnés'}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Actions secondaires -->
    <div class="actions-row">
      <button class="btn-action" on:click={() => { mode = 'creating'; newName = search; search = ''; }}>
        ＋ Créer un profil
      </button>
      <button class="btn-action btn-guest" on:click={() => { mode = 'guest'; guestName = search; search = ''; }}>
        👤 Invité
      </button>
    </div>
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
    gap: 8px;
    min-width: 0;
  }

  .player-num {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 1px;
    flex-shrink: 0;
  }

  .player-name {
    font-size: 16px;
    font-weight: bold;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge-profile,
  .badge-guest {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 20px;
    flex-shrink: 0;
  }

  .badge-profile {
    background: rgba(var(--color-gold-rgb), 0.15);
    border: 1px solid rgba(var(--color-gold-rgb), 0.35);
    color: var(--color-gold);
  }

  .badge-guest {
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

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  .search-input.input-error {
    border-color: rgba(255, 80, 80, 0.5);
  }

  .error-hint {
    font-size: 12px;
    color: rgba(255, 120, 120, 0.9);
    padding: 0 2px;
  }

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
  .profile-item-arrow { color: rgba(255, 255, 255, 0.3); font-size: 13px; }

  .empty-hint {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.3);
    text-align: center;
    padding: 8px 0;
  }

  /* ── Actions secondaires ── */
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
  }

  .btn-guest {
    color: rgba(255, 255, 255, 0.45);
  }

  /* ── Formulaires inline ── */
  .inline-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .inline-actions {
    display: flex;
    gap: 8px;
  }

  .btn-confirm {
    flex: 1;
    background: rgba(var(--color-gold-rgb), 0.2);
    border: 1px solid rgba(var(--color-gold-rgb), 0.4);
    border-radius: 10px;
    color: var(--color-gold);
    font-size: 14px;
    font-weight: bold;
    padding: 9px 14px;
    cursor: pointer;
  }

  .btn-confirm:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
