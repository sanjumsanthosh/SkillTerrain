<script lang="ts">
  import { onMount } from 'svelte';
  import HeatmapGrid from './HeatmapGrid.svelte';
  import type { SkillTerrainJob } from '../lib/types';

  export let fileId: string;
  export let key: string;

  type VaultState = 'loading' | 'decrypting' | 'ready' | 'error';

  let state: VaultState = 'loading';
  let job: SkillTerrainJob | null = null;
  let errorMessage = '';

  onMount(async () => {
    try {
      // 1. Fetch the encrypted blob
      // import.meta.env.BASE_URL = '/SkillTerrain/' on GH Pages, '/' in dev
      state = 'loading';
      const res = await fetch(`${import.meta.env.BASE_URL}data/${fileId}.enc`);
      if (!res.ok) {
        throw new Error(`File not found (${res.status}). The link may be invalid or expired.`);
      }
      const fileBuffer = await res.arrayBuffer();

      state = 'decrypting';

      // 2. Parse file layout: [IV 12B] + [Ciphertext NB] + [GCM Tag 16B]
      const iv = new Uint8Array(fileBuffer, 0, 12);
      const ciphertext = new Uint8Array(fileBuffer, 12); // Web Crypto expects tag appended

      // 3. Derive AES key: pad the user key to 16 chars then encode as bytes
      const aesKeyString = key.padEnd(16, '0').substring(0, 16);
      const keyBytes = new TextEncoder().encode(aesKeyString);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt'],
      );

      // 4. Decrypt — Web Crypto automatically validates the GCM auth tag
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        ciphertext,
      );

      // 5. Parse and render
      const rawJson = new TextDecoder().decode(decryptedBuffer);
      job = JSON.parse(rawJson) as SkillTerrainJob;
      state = 'ready';
    } catch (err) {
      state = 'error';
      if (err instanceof Error && err.message.includes('File not found')) {
        errorMessage = err.message;
      } else {
        // Most likely a decryption failure — wrong key
        errorMessage = 'Decryption failed. This link may be invalid, expired, or the key is incorrect.';
      }
      console.error('[VaultView]', err);
    }
  });
</script>

<div class="vault-shell">
  {#if state === 'loading'}
    <div class="vault-status">
      <div class="vault-spinner" aria-hidden="true"></div>
      <p>Fetching encrypted payload…</p>
    </div>
  {:else if state === 'decrypting'}
    <div class="vault-status">
      <div class="vault-spinner" aria-hidden="true"></div>
      <p>Decrypting heatmap…</p>
    </div>
  {:else if state === 'error'}
    <div class="vault-error" role="alert">
      <div class="vault-error-icon" aria-hidden="true">🔒</div>
      <h2>Access Denied</h2>
      <p>{errorMessage}</p>
      <small>File ID: <code>{fileId}</code></small>
    </div>
  {:else if state === 'ready' && job}
    <header class="vault-topbar">
      <div class="vault-brand">
        <p class="eyebrow">SkillTerrain · Shared view</p>
        <h1>{job.title}</h1>
        {#if job.company}
          <p class="vault-company">{job.company}</p>
        {/if}
      </div>
      <span class="vault-badge" aria-label="Read-only shared view">Read-only</span>
    </header>

    <HeatmapGrid {job} />

    <footer class="vault-footer">
      <p>This is a read-only snapshot shared via an encrypted link. Data never leaves your browser.</p>
    </footer>
  {/if}
</div>

<style>
  .vault-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Loading / Decrypting ── */
  .vault-status {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-2, #94a3b8);
    font-size: 0.9rem;
  }

  .vault-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--surface-2, #1e293b);
    border-top-color: var(--accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Error ── */
  .vault-error {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    text-align: center;
  }

  .vault-error-icon {
    font-size: 3rem;
    filter: grayscale(0.3);
  }

  .vault-error h2 {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-1, #f1f5f9);
    margin: 0;
  }

  .vault-error p {
    color: var(--text-2, #94a3b8);
    max-width: 38ch;
    line-height: 1.6;
    margin: 0;
  }

  .vault-error small {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-3, #475569);
  }

  .vault-error code {
    font-family: monospace;
    background: var(--surface-2, #1e293b);
    padding: 0.1em 0.4em;
    border-radius: 4px;
  }

  /* ── Top bar ── */
  .vault-topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid var(--border, #1e293b);
    flex-wrap: wrap;
  }

  .vault-brand .eyebrow {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent, #6366f1);
    margin: 0 0 0.25rem;
  }

  .vault-brand h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-1, #f1f5f9);
    margin: 0;
    line-height: 1.2;
  }

  .vault-company {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: var(--text-2, #94a3b8);
  }

  .vault-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.75rem;
    background: color-mix(in srgb, var(--accent, #6366f1) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent, #6366f1) 35%, transparent);
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent, #6366f1);
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 0.25rem;
  }

  /* ── Footer ── */
  .vault-footer {
    padding: 1.25rem 2rem;
    border-top: 1px solid var(--border, #1e293b);
    text-align: center;
  }

  .vault-footer p {
    font-size: 0.75rem;
    color: var(--text-3, #475569);
    margin: 0;
  }
</style>
