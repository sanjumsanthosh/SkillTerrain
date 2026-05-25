<script lang="ts">
  import { onMount } from 'svelte';
  import CompareView from './components/CompareView.svelte';
  import HeatmapGrid from './components/HeatmapGrid.svelte';
  import ImportJob from './components/ImportJob.svelte';
  import JobManager from './components/JobManager.svelte';
  import VaultView from './components/VaultView.svelte';
  import { readinessScore } from './lib/scoring';
  import {
    createEmptyWorkspace,
    deleteJob,
    loadWorkspace,
    saveWorkspace,
    setActiveView,
    upsertJob,
    updateDrafts,
  } from './lib/storage';
  import type { AppView, SkillTerrainJob, SkillTerrainWorkspace, WorkspaceDrafts } from './lib/types';

  const views: { id: AppView; label: string; hint: string }[] = [
    { id: 'import', label: 'Import Job', hint: 'paste JD + generated JSON' },
    { id: 'heatmap', label: 'Heatmap', hint: 'navigate scores' },
    { id: 'jobs', label: 'Manage Jobs', hint: 'edit, duplicate, backup' },
    { id: 'compare', label: 'Compare', hint: 'delta view' },
  ];

  let workspace: SkillTerrainWorkspace = createEmptyWorkspace();
  let ready = false;

  // ── Vault (shared read-only) mode ──────────────────────────────────────────
  // Detected when the URL hash matches: #<8-char fileId>_<key>
  // e.g. https://sanjumsanthosh.github.io/SkillTerrain/#a7b8c9d0_mysecretkey15
  let vaultParams: { fileId: string; key: string } | null = null;

  function parseVaultHash(hash: string): { fileId: string; key: string } | null {
    const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
    const underscoreIdx = stripped.indexOf('_');
    if (underscoreIdx === -1) return null;
    const fileId = stripped.slice(0, underscoreIdx);
    const key    = stripped.slice(underscoreIdx + 1);
    // fileId must be 8 hex chars; key must be at least 10 chars
    if (/^[0-9a-f]{8}$/.test(fileId) && key.length >= 10) {
      return { fileId, key };
    }
    return null;
  }

  $: activeJob = workspace.jobs.find((job) => job.id === workspace.activeJobId);
  $: readiness = activeJob ? readinessScore(activeJob.heatmap) : 0;

  onMount(() => {
    // Check for vault share link first — takes full priority over normal routing
    const vault = parseVaultHash(window.location.hash);
    if (vault) {
      vaultParams = vault;
      ready = true;
      return;
    }

    const loaded = loadWorkspace();
    const view = viewFromHash();
    workspace = view ? setActiveView(loaded, view) : loaded;
    ready = true;

    const onHashChange = () => {
      const nextView = viewFromHash();
      if (nextView && nextView !== workspace.activeView) {
        commit(setActiveView(workspace, nextView));
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  });

  $: if (ready && workspace.jobs.length === 0 && workspace.activeView !== 'import') {
    navigate('import');
  }

  function commit(next: SkillTerrainWorkspace): void {
    workspace = next;
    saveWorkspace(workspace);
  }

  function navigate(view: AppView): void {
    history.replaceState(null, '', `#${view}`);
    commit(setActiveView(workspace, view));
  }

  function handleDrafts(event: CustomEvent<Partial<WorkspaceDrafts>>): void {
    commit(updateDrafts(workspace, event.detail));
  }

  function handleSaveJob(event: CustomEvent<SkillTerrainJob>): void {
    commit(upsertJob(workspace, event.detail));
    history.replaceState(null, '', '#heatmap');
  }

  function handleActivate(event: CustomEvent<string>): void {
    commit({ ...workspace, activeJobId: event.detail, activeView: 'heatmap' });
    history.replaceState(null, '', '#heatmap');
  }

  function handleDelete(event: CustomEvent<string>): void {
    commit(deleteJob(workspace, event.detail));
  }

  function handleDuplicate(event: CustomEvent<SkillTerrainJob>): void {
    commit(upsertJob(workspace, event.detail));
  }

  function handleUpdateJob(event: CustomEvent<SkillTerrainJob>): void {
    commit(upsertJob(workspace, event.detail));
  }

  function handleImportWorkspace(event: CustomEvent<SkillTerrainWorkspace>): void {
    commit(event.detail);
  }

  function viewFromHash(): AppView | undefined {
    const hash = window.location.hash.replace('#', '');
    return views.some((view) => view.id === hash) ? (hash as AppView) : undefined;
  }
</script>

{#if vaultParams}
  <VaultView fileId={vaultParams.fileId} key={vaultParams.key} />
{:else}
<main class="app-shell">
  <header class="topbar">
    <div>
      <p class="eyebrow">Private static workspace</p>
      <h1>SkillTerrain</h1>
      <p class="tagline">Evidence-backed heatmaps for comparing what you know against where you want to go.</p>
    </div>

    <section class="status-strip" aria-label="Workspace summary">
      <div class="status-chip">
        <span>Jobs</span>
        <strong>{workspace.jobs.length}</strong>
      </div>
      <div class="status-chip">
        <span>Active</span>
        <strong>{activeJob?.title ?? 'None'}</strong>
      </div>
      <div class="status-chip">
        <span>Avg score</span>
        <strong>{activeJob ? `${readiness}%` : '--'}</strong>
      </div>
    </section>
  </header>

  <nav class="nav-tabs" aria-label="SkillTerrain views">
    {#each views as view}
      <button
        type="button"
        class:active={workspace.activeView === view.id}
        on:click={() => navigate(view.id)}
      >
        <span>{view.label}</span>
        <small>{view.hint}</small>
      </button>
    {/each}
  </nav>

  {#if workspace.activeView === 'import'}
    <ImportJob
      drafts={workspace.drafts}
      on:drafts={handleDrafts}
      on:saveJob={handleSaveJob}
    />
  {:else if workspace.activeView === 'heatmap'}
    {#if activeJob}
      <HeatmapGrid job={activeJob} />
    {:else}
      <section class="empty-state">
        <h2>No active job yet</h2>
        <p>Import a job description, generate the schema prompt, paste generated JSON, and SkillTerrain will render it here.</p>
        <button type="button" on:click={() => navigate('import')}>Import your first job</button>
      </section>
    {/if}
  {:else if workspace.activeView === 'jobs'}
    <JobManager
      workspace={workspace}
      on:activate={handleActivate}
      on:delete={handleDelete}
      on:duplicate={handleDuplicate}
      on:updateJob={handleUpdateJob}
      on:importWorkspace={handleImportWorkspace}
    />
  {:else if workspace.activeView === 'compare'}
    <CompareView jobs={workspace.jobs} />
  {/if}
</main>
{/if}
