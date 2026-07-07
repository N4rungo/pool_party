<script>
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { profilesStore, createProfile, renameProfile, deleteProfile } from '$lib/stores/profiles.js';
  import { historyStore, unlinkProfile } from '$lib/stores/history.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import PencilIcon from '$lib/components/PencilIcon.svelte';

  const MAX_NAME = 16;

  // ── Création ───────────────────────────────────────────────────────────
  let newProfileName = '';

  function addProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    if ($profilesStore.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
    createProfile(name);
    newProfileName = '';
  }

  // ── Renommage inline ───────────────────────────────────────────────────
  let editingId   = null;
  let editingName = '';

  function startEdit(profile) {
    editingId   = profile.id;
    editingName = profile.name;
  }

  function commitEdit() {
    const name = editingName.trim();
    if (!name) { editingId = null; return; }
    const duplicate = $profilesStore.some(p => p.id !== editingId && p.name.toLowerCase() === name.toLowerCase());
    if (!duplicate) renameProfile(editingId, name);
    editingId = null;
  }

  function cancelEdit() { editingId = null; }

  // ── Suppression ────────────────────────────────────────────────────────
  async function handleDelete(profile) {
    const hasHistory = $historyStore.some(e => e.players.some(p => p.profileId === profile.id));
    const $t = get(t);
    const suffix = hasHistory ? $t('players.deleteHistorySuffix') : '';
    if (await askConfirm($t('players.deleteConfirm', { values: { name: profile.name } }) + suffix, {
      icon: '🗑️', confirmLabel: $t('players.delete'), cancelLabel: $t('players.cancel'),
    })) {
      unlinkProfile(profile.id);
      deleteProfile(profile.id);
    }
  }
</script>

<div class="page">

  <!-- Créer un profil -->
  <div class="section-label">{$t('players.newProfile')}</div>
  <div class="create-row">
    <input
      type="text"
      bind:value={newProfileName}
      placeholder={$t('setup.playerName')}
      maxlength={MAX_NAME}
      class="text-input"
      on:keydown={e => e.key === 'Enter' && addProfile()}
    />
    <button class="btn-add" on:click={addProfile} disabled={!newProfileName.trim()}>{$t('players.create')}</button>
  </div>

  <!-- Liste des profils -->
  {#if $profilesStore.length === 0}
    <div class="empty-state">{$t('players.noProfile')}</div>
  {:else}
    <div class="section-label" style="margin-top: 24px">
      {$t('players.profiles', { values: { count: $profilesStore.length } })}
    </div>
    <div class="profile-list">
      {#each $profilesStore as profile (profile.id)}
        {#if editingId === profile.id}
          <div class="profile-row">
            <input
              type="text"
              bind:value={editingName}
              maxlength={MAX_NAME}
              class="text-input text-input-inline"
              on:keydown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
            />
            <button class="icon-btn icon-btn-green" on:click={commitEdit} title={$t('players.validate')}>✓</button>
            <button class="icon-btn" on:click={cancelEdit} title={$t('players.cancel')}>✕</button>
          </div>
        {:else}
          <div class="profile-row">
            <button class="profile-name-btn" on:click={() => goto(`${base}/stats/${profile.id}`)}>
              {profile.name}
            </button>
            <button class="icon-btn" on:click={() => startEdit(profile)} title={$t('players.rename')}><PencilIcon size="1em" /></button>
            <button class="icon-btn icon-btn-red" on:click={() => handleDelete(profile)} title={$t('players.delete')}>🗑️</button>
          </div>
        {/if}
      {/each}
    </div>
  {/if}

</div>

<style>
  .page {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 20px;
    padding-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    font-size: 11px;
    color: rgba(var(--color-text-rgb), 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .create-row {
    display: flex;
    gap: 8px;
  }

  .text-input {
    flex: 1;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(var(--color-text-rgb), 0.15);
    border-radius: 10px;
    color: white;
    font-family: inherit;
    font-size: 15px;
    padding: 10px 12px;
    outline: none;
    min-width: 0;
  }

  .text-input:focus { border-color: rgba(var(--color-gold-rgb), 0.5); }
  .text-input-inline { flex: 1; }

  .btn-add {
    background: rgba(var(--color-gold-rgb), 0.2);
    border: 1px solid rgba(var(--color-gold-rgb), 0.4);
    border-radius: 10px;
    color: var(--color-gold);
    font-family: inherit;
    font-size: 14px;
    font-weight: bold;
    padding: 10px 16px;
    cursor: pointer;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-add:disabled { opacity: 0.35; cursor: default; }

  .empty-state {
    text-align: center;
    color: rgba(var(--color-text-rgb), 0.35);
    font-size: 14px;
    padding: 32px 0;
    font-style: italic;
  }

  .profile-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .profile-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(var(--color-text-rgb), 0.07);
    border-radius: 12px;
    padding: 10px 12px;
  }

  .profile-name-btn {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    color: white;
    font-family: inherit;
    font-size: 15px;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-tap-highlight-color: transparent;
  }

  .profile-name-btn:hover { text-decoration: underline; }

  .icon-btn {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    opacity: 0.65;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.12s;
  }

  .icon-btn:hover, .icon-btn:active { opacity: 1; }
  .icon-btn-red   { color: #ff6b6b; }
  .icon-btn-green { color: #69db7c; }
</style>
