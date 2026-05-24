<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { createId, exportWorkspace, importWorkspace } from '../lib/storage';
  import type { SkillTerrainJob, SkillTerrainWorkspace } from '../lib/types';

  export let workspace: SkillTerrainWorkspace;

  const dispatch = createEventDispatcher<{
    activate: string;
    delete: string;
    duplicate: SkillTerrainJob;
    updateJob: SkillTerrainJob;
    importWorkspace: SkillTerrainWorkspace;
  }>();

  let backupText = '';
  let importText = '';
  let importError = '';

  $: backupText = exportWorkspace(workspace);

  function duplicateJob(job: SkillTerrainJob): void {
    const now = new Date().toISOString();
    dispatch('duplicate', {
      ...job,
      id: createId('job'),
      title: `${job.title} copy`,
      createdAt: now,
      updatedAt: now,
    });
  }

  function updateTitle(job: SkillTerrainJob, title: string): void {
    dispatch('updateJob', {
      ...job,
      title,
      updatedAt: new Date().toISOString(),
    });
  }

  function updateCompany(job: SkillTerrainJob, company: string): void {
    dispatch('updateJob', {
      ...job,
      company,
      updatedAt: new Date().toISOString(),
    });
  }

  function importBackup(): void {
    try {
      const imported = importWorkspace(importText);
      dispatch('importWorkspace', imported);
      importError = '';
    } catch (error) {
      importError = error instanceof Error ? error.message : 'Workspace import failed.';
    }
  }

  async function copyBackup(): Promise<void> {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(backupText);
    }
  }
</script>

<section class="panel">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Workspace</p>
      <h2>Manage jobs</h2>
    </div>
    <p>Edit metadata, duplicate maps for experiments, or backup everything as JSON.</p>
  </div>

  {#if workspace.jobs.length === 0}
    <div class="empty-inline">No saved jobs yet. Import a job to create your first heatmap.</div>
  {:else}
    <div class="job-list">
      {#each workspace.jobs as job}
        <article class:active={workspace.activeJobId === job.id} class="job-card">
          <div class="job-card-fields">
            <label>
              <span>Title</span>
              <input value={job.title} on:change={(event) => updateTitle(job, (event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label>
              <span>Company</span>
              <input value={job.company ?? ''} on:change={(event) => updateCompany(job, (event.currentTarget as HTMLInputElement).value)} />
            </label>
          </div>

          <div class="job-meta">
            <span>{job.heatmap.requirements.length} requirements</span>
            <span>{job.heatmap.lenses.length} lenses</span>
            <span>Updated {new Date(job.updatedAt).toLocaleDateString()}</span>
          </div>

          <div class="action-row">
            <button type="button" class="primary" on:click={() => dispatch('activate', job.id)}>Open</button>
            <button type="button" on:click={() => duplicateJob(job)}>Duplicate</button>
            <button type="button" class="danger" on:click={() => dispatch('delete', job.id)}>Delete</button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<section class="panel backup-grid">
  <div>
    <div class="panel-heading compact">
      <div>
        <p class="eyebrow">Backup</p>
        <h2>Export workspace</h2>
      </div>
    </div>
    <textarea class="json compact-json" readonly value={backupText}></textarea>
    <div class="action-row">
      <button type="button" on:click={copyBackup}>Copy backup JSON</button>
    </div>
  </div>

  <div>
    <div class="panel-heading compact">
      <div>
        <p class="eyebrow">Restore</p>
        <h2>Import workspace</h2>
      </div>
    </div>
    <textarea class="json compact-json" bind:value={importText} placeholder="Paste exported workspace JSON here"></textarea>
    {#if importError}
      <div class="error-box">{importError}</div>
    {/if}
    <div class="action-row">
      <button type="button" class="primary" on:click={importBackup}>Import backup</button>
    </div>
  </div>
</section>
