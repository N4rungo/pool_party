<!--
  PlayerPicker — sélection d'un joueur pour le setup d'une partie.

  Pour chaque slot joueur, on propose :
  • Choisir un profil existant (liste filtrée par recherche)
  • Créer un nouveau profil (nom → profil créé + sélectionné)
  • Jouer en invité (nom libre, pas de stats sauvegardées)

  Props :
    value     : { name: string, profileId: string|null }  (bind:value)
    index     : number  (numéro du slot, pour l'affichage)
    exclude   : string[]  (profileIds déjà sélectionnés dans d'autres slots)
-->
<script>
  import { profilesStore, createProfile } from '$lib/stores/profiles.js';

  export let value = { name: '', profileId: null };
  export let index = 0;
  export let exclude = [];

  // Mode du picker : 'idle' | 'picking' | 'guest' | 'creating'
  let mode = value.profileId ? 'idle' : (value.name ? 'guest' : 'idle');

  let search = '';
  let newName = '';
  let guestName = value.profileId ? '' : value.name;

  $: availableProfiles = $profilesStore.filter(p =>
    !exclude.includes(p.id) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  $: selectedProfile = value.profileId
    ? $profilesStore.find(p => p.id === value.profileId) ?? null
    : null;

  function selectProfile(profile) {
    value = { name: profile.name, profileId: profile.id };
    mode = 'idle';
    search = '';
  }

  function confirmGuest() {
    const name = guestName.trim();
    if (!name) return;
    value = { name, profileId: null };
    mode = 'idle';
  }

  function confirmCreate() {
    const name = newName.trim();
    if (!name) return;
    const profile = createProfile(name);
    value = { name: profile.name, profileId: profile.id };
    mode = 'idle';
    newName = '';
  }

  function clear() {
    value = { name: '', profileId: null };
    guestName = '';
    search = '';
    mode = 'picking';
  }
</script>

<div class="player-picker">
  <!-- ── État : un joueur est sélectionné ── -->
  {#if mode === 'idle' && value.name}
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

  <!-- ── État : choix du mode ── -->
  {:else}
    <div class="picker-header">
      <span class="player-num">J{index + 1}</span>
      <span class="picker-label">Choisir le joueur</span>
    </div>

    {#if mode !== 'guest' && mode !== 'creating'}
      <!-- Barre de recherche + liste des profils -->
      <div class="search-row">
        <input
          class="search-input"
          type="text"
          placeholder="Rechercher un profil…"
          bind:value={search}
          on:focus={() => mode = 'picking'}
        />
      </div>

      {#if availableProfiles.length > 0}
        <div class="profile-list">
          {#each availableProfiles as profile}
            <button class="profile-item" on:click={() => selectProfile(profile)}>
              <span class="profile-item-name">{profile.name}</span>
              <span class="profile-item-arrow">→</span>
            </button>
          {/each}
        </div>
      {:else if search}
        <div class="empty-hint">Aucun profil trouvé pour « {search} »</div>
      {:else if $profilesStore.length === 0}
        <div class="empty-hint">Aucun profil enregistré</div>
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

    {:else if mode === 'guest'}
      <!-- Saisie nom invité -->
      <div class="inline-form">
        <input
          class="search-input"
          type="text"
          placeholder="Pseudo de l'invité…"
          bind:value={guestName}
          on:keydown={e => e.key === 'Enter' && confirmGuest()}
          autofocus
        />
        <div class="inline-actions">
          <button class="btn-action" on:click={() => mode = 'picking'}>← Retour</button>
          <button class="btn-confirm" on:click={confirmGuest} disabled={!guestName.trim()}>
            Confirmer
          </button>
        </div>
      </div>

    {:else if mode === 'creating'}
      <!-- Création de profil -->
      <div class="inline-form">
        <input
          class="search-input"
          type="text"
          placeholder="Nom du nouveau profil…"
          bind:value={newName}
          on:keydown={e => e.key === 'Enter' && confirmCreate()}
          autofocus
        />
        <div class="inline-actions">
          <button class="btn-action" on:click={() => mode = 'picking'}>← Retour</button>
          <button class="btn-confirm" on:click={confirmCreate} disabled={!newName.trim()}>
            Créer et sélectionner
          </button>
        </div>
      </div>
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

  /* ── Recherche ── */
  .search-row {
    display: flex;
    gap: 8px;
  }

  .search-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    color: white;
    font-size: 15px;
    padding: 9px 12px;
    outline: none;
  }

  .search-input:focus {
    border-color: rgba(var(--color-gold-rgb), 0.4);
    background: rgba(255, 255, 255, 0.08);
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  /* ── Liste des profils ── */
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

  /* ── Formulaire inline ── */
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
