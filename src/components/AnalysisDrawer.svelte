<script lang="ts">
  import type { ActiveCellContext } from '../lib/types';

  export let context: ActiveCellContext | undefined;
  export let pinned = false;
</script>

<aside class:visible={Boolean(context)} class:pinned class="analysis-drawer" aria-live="polite">
  {#if context}
    <div class="drawer-title">
      <div>
        <p>{pinned ? 'Pinned analysis' : 'Live analysis'}</p>
        <h2>{context.requirement.label} · {context.column.label}</h2>
      </div>
      <strong>{context.cell.score > 0 ? '+' : ''}{context.cell.score.toFixed(1)}</strong>
    </div>
    {#if context.cell.scoreLabel}
      <p class="score-label">{context.cell.scoreLabel}</p>
    {/if}

    <div class="drawer-grid">
      <section>
        <span>Role asks</span>
        <p>{context.cell.summary}</p>
        <ul>
          {#each [...(context.requirement.roleSignals ?? []), ...context.cell.roleEvidence].slice(0, 5) as item}
            <li>{item}</li>
          {/each}
        </ul>
        <small>{context.lens.title} · {context.requirement.category}</small>
      </section>

      <section>
        <span>Your proof</span>
        <p>{context.cell.whyGood}</p>
        <ul>
          {#each context.cell.evidence.slice(0, 4) as item}
            <li>{item}</li>
          {/each}
        </ul>
      </section>

      <section>
        <span>Gap and next move</span>
        <p>{context.cell.whyGap}</p>
        <ul>
          {#each context.cell.nextActions.slice(0, 4) as item}
            <li>{item}</li>
          {/each}
        </ul>
      </section>
    </div>
  {:else}
    <div class="drawer-title">
      <div>
        <p>Keyboard ready</p>
        <h2>Focus any heat cell to preview analysis</h2>
      </div>
      <strong>↔</strong>
    </div>
  {/if}
</aside>
