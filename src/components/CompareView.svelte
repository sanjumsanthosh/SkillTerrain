<script lang="ts">
  import { compareJobs, deltaColor, deltaText } from '../lib/scoring';
  import type { SkillTerrainJob } from '../lib/types';

  export let jobs: SkillTerrainJob[];

  let leftJobId = '';
  let rightJobId = '';

  $: if (!leftJobId && jobs[0]) leftJobId = jobs[0].id;
  $: if (!rightJobId && jobs[1]) rightJobId = jobs[1].id;
  $: leftJob = jobs.find((job) => job.id === leftJobId);
  $: rightJob = jobs.find((job) => job.id === rightJobId);
  $: comparison = leftJob && rightJob && leftJob.id !== rightJob.id ? compareJobs(leftJob, rightJob) : undefined;
  $: topCells = comparison?.cells.filter((cell) => cell.status === 'shared') ?? [];
</script>

<section class="panel">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Delta mode</p>
      <h2>Compare two terrains</h2>
    </div>
    <p>Compare two saved maps by shared requirement, lens, and metric labels. Green means the right map scores higher; orange means lower.</p>
  </div>

  {#if jobs.length < 2}
    <div class="empty-inline">Save at least two jobs or project maps to compare terrain deltas.</div>
  {:else}
    <div class="form-grid">
      <label>
        <span>Left baseline</span>
        <select bind:value={leftJobId}>
          {#each jobs as job}
            <option value={job.id}>{job.title}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Right comparison</span>
        <select bind:value={rightJobId}>
          {#each jobs as job}
            <option value={job.id}>{job.title}</option>
          {/each}
        </select>
      </label>
    </div>

    {#if comparison}
      <div class="compare-summary">
        <div class="status-chip">
          <span>Shared requirements</span>
          <strong>{comparison.sharedRequirements}</strong>
        </div>
        <div class="status-chip">
          <span>Shared lenses</span>
          <strong>{comparison.sharedLenses}</strong>
        </div>
        <div class="status-chip">
          <span>Comparable cells</span>
          <strong>{comparison.cells.filter((cell) => cell.status === 'shared').length}</strong>
        </div>
      </div>

      <div class="compare-grid" role="table" aria-label="Comparison heatmap">
        {#each topCells as cell}
          <div
            class="compare-cell"
            style={`background:${deltaColor(cell)}`}
            title={`${cell.requirementLabel} / ${cell.lensLabel} / ${cell.columnLabel}: ${deltaText(cell)}`}
          >
            <span>{cell.requirementLabel}</span>
            <strong>{deltaText(cell)}</strong>
            <small>{cell.columnLabel}</small>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-inline">Choose two different maps to compare.</div>
    {/if}
  {/if}
</section>
