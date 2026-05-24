<script lang="ts">
  import AnalysisDrawer from './AnalysisDrawer.svelte';
  import { getActiveCell, getCell, readinessScore, scoreColor, textColor } from '../lib/scoring';
  import type { ActiveCellContext, CellPointer, HeatmapLens, SkillTerrainJob } from '../lib/types';

  export let job: SkillTerrainJob;

  let pointer: CellPointer | undefined;
  let pinnedPointer: CellPointer | undefined;

  $: activePointer = pinnedPointer ?? pointer;
  $: activeContext = activePointer
    ? withPinned(getActiveCell(job, activePointer.lensId, activePointer.requirementId, activePointer.columnId), Boolean(pinnedPointer))
    : undefined;
  $: score = readinessScore(job.heatmap);

  function preview(lensId: string, requirementId: string, columnId: string): void {
    pointer = { lensId, requirementId, columnId, pinned: false };
  }

  function pin(lensId: string, requirementId: string, columnId: string): void {
    pinnedPointer = { lensId, requirementId, columnId, pinned: true };
    pointer = pinnedPointer;
  }

  function clearPin(): void {
    pinnedPointer = undefined;
  }

  function move(event: KeyboardEvent, lens: HeatmapLens, rowIndex: number, requirementIndex: number): void {
    const requirementCount = job.heatmap.requirements.length;
    const rowCount = lens.columns.length;
    let nextRow = rowIndex;
    let nextRequirement = requirementIndex;
    let nextLensIndex = job.heatmap.lenses.findIndex((item) => item.id === lens.id);

    if (event.key === 'ArrowRight') nextRequirement = Math.min(requirementCount - 1, requirementIndex + 1);
    else if (event.key === 'ArrowLeft') nextRequirement = Math.max(0, requirementIndex - 1);
    else if (event.key === 'ArrowDown') {
      if (rowIndex < rowCount - 1) nextRow = rowIndex + 1;
      else nextLensIndex = Math.min(job.heatmap.lenses.length - 1, nextLensIndex + 1);
    } else if (event.key === 'ArrowUp') {
      if (rowIndex > 0) nextRow = rowIndex - 1;
      else nextLensIndex = Math.max(0, nextLensIndex - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pin(lens.id, job.heatmap.requirements[requirementIndex].id, lens.columns[rowIndex].id);
      return;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      clearPin();
      return;
    } else {
      return;
    }

    event.preventDefault();
    const nextLens = job.heatmap.lenses[nextLensIndex];
    const nextColumn = nextLens.columns[Math.min(nextRow, nextLens.columns.length - 1)];
    const nextRequirementItem = job.heatmap.requirements[nextRequirement];
    preview(nextLens.id, nextRequirementItem.id, nextColumn.id);
    focusCell(nextLens.id, nextColumn.id, nextRequirementItem.id);
  }

  function focusCell(lensId: string, columnId: string, requirementId: string): void {
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLButtonElement>(
        `[data-cell="${lensId}:${columnId}:${requirementId}"]`,
      );
      element?.focus();
    });
  }

  function withPinned(context: ActiveCellContext | undefined, pinned: boolean): ActiveCellContext | undefined {
    if (!context) {
      return undefined;
    }

    return {
      ...context,
      pointer: { ...context.pointer, pinned },
    };
  }
</script>

<section class="heatmap-page">
  <div class="heatmap-header">
    <div>
      <p class="eyebrow">Active terrain</p>
      <h2>{job.title}</h2>
      <p>{job.company ?? job.heatmap.targetRole.company ?? 'Personal role map'} · {job.heatmap.requirements.length} requirements · {job.heatmap.lenses.length} lenses</p>
    </div>
    <div class="score-chip">
      <span>Readiness</span>
      <strong>{score}%</strong>
    </div>
  </div>

  <div class="keyboard-hint">
    Arrow keys preview cells live. Enter/Space pins analysis. Escape unpins.
  </div>

  {#each job.heatmap.lenses as lens}
    <section class="heatmap-section" aria-labelledby={`${lens.id}-title`}>
      <div class="lens-title">
        <div>
          <h3 id={`${lens.id}-title`}>{lens.title}</h3>
          <p>{lens.description}</p>
        </div>
      </div>

      <div class="heatmap-scroll">
        <table class="heatmap-table">
          <thead>
            <tr>
              <th class="metric-label">Metric</th>
              {#each job.heatmap.requirements as requirement}
                <th class="requirement-label" title={requirement.description ?? requirement.label}>
                  <span>{requirement.label}</span>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each lens.columns as column, rowIndex}
              <tr>
                <th class="metric-label" title={column.description ?? column.label}>{column.label}</th>
                {#each job.heatmap.requirements as requirement, requirementIndex}
                  {@const cell = getCell(job.heatmap, requirement.id, lens.id, column.id)}
                  <td>
                    {#if cell}
                      <button
                        type="button"
                        class="heat-cell"
                        class:active={activePointer?.lensId === lens.id && activePointer?.columnId === column.id && activePointer?.requirementId === requirement.id}
                        data-cell={`${lens.id}:${column.id}:${requirement.id}`}
                        style={`background:${scoreColor(cell.score)};color:${textColor(cell.score)}`}
                        title={`${requirement.label} / ${column.label}: ${cell.summary}`}
                        aria-label={`${lens.title}, ${requirement.label}, ${column.label}, score ${cell.score} on a minus five to five scale`}
                        on:mouseenter={() => preview(lens.id, requirement.id, column.id)}
                        on:focus={() => preview(lens.id, requirement.id, column.id)}
                        on:click={() => pin(lens.id, requirement.id, column.id)}
                        on:keydown={(event) => move(event, lens, rowIndex, requirementIndex)}
                      >
                        {cell.score > 0 ? '+' : ''}{cell.score.toFixed(1)}
                      </button>
                    {:else}
                      <span class="missing-cell">?</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/each}

  <AnalysisDrawer context={activeContext} pinned={Boolean(pinnedPointer)} />
</section>
