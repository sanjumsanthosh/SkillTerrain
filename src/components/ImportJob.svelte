<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { generateHeatmapPrompt } from '../lib/prompt';
  import { createId } from '../lib/storage';
  import { validateHeatmapJson } from '../lib/validation';
  import type { SkillTerrainJob, WorkspaceDrafts } from '../lib/types';

  export let drafts: WorkspaceDrafts;

  const dispatch = createEventDispatcher<{
    drafts: Partial<WorkspaceDrafts>;
    saveJob: SkillTerrainJob;
  }>();

  let title = drafts.title;
  let company = drafts.company;
  let description = drafts.description;
  let notes = drafts.notes;
  let generatedPrompt = drafts.generatedPrompt;
  let jsonText = drafts.jsonText;
  let validationErrors: string[] = [];
  let copyMessage = '';

  function persistDrafts(): void {
    dispatch('drafts', { title, company, description, notes, generatedPrompt, jsonText });
  }

  function generatePrompt(): void {
    generatedPrompt = generateHeatmapPrompt({ title, company, description, notes, generatedPrompt, jsonText });
    persistDrafts();
  }

  async function copyPrompt(): Promise<void> {
    if (!generatedPrompt.trim() || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(generatedPrompt);
    copyMessage = 'Prompt copied';
    setTimeout(() => {
      copyMessage = '';
    }, 1800);
  }

  function saveJson(): void {
    persistDrafts();
    const result = validateHeatmapJson(jsonText);
    if (!result.ok || !result.model) {
      validationErrors = result.errors;
      return;
    }

    const now = new Date().toISOString();
    const job: SkillTerrainJob = {
      id: createId('job'),
      title: title.trim() || result.model.targetRole.title,
      company: company.trim() || result.model.targetRole.company,
      sourceDescription: description,
      notes,
      heatmap: result.model,
      createdAt: now,
      updatedAt: now,
    };

    validationErrors = [];
    dispatch('saveJob', job);
  }
</script>

<section class="panel import-layout">
  <div class="panel-heading">
    <div>
      <p class="eyebrow">Step 1</p>
      <h2>Import a target role</h2>
    </div>
    <p>Paste the job description, generate a detailed LLM prompt, then paste the returned SkillTerrain JSON.</p>
  </div>

  <div class="form-grid">
    <label>
      <span>Role title</span>
      <input bind:value={title} on:input={persistDrafts} placeholder="AI Platform Engineer" />
    </label>

    <label>
      <span>Company / context</span>
      <input bind:value={company} on:input={persistDrafts} placeholder="Example Labs" />
    </label>
  </div>

  <label>
    <span>Full job description</span>
    <textarea class="tall" bind:value={description} on:input={persistDrafts} placeholder="Paste the full role description here..."></textarea>
  </label>

  <label>
    <span>Optional personal evidence notes</span>
    <textarea bind:value={notes} on:input={persistDrafts} placeholder="Paste resume/project notes, evidence summaries, or constraints..."></textarea>
  </label>

  <div class="action-row">
    <button type="button" class="primary" on:click={generatePrompt}>Generate prompt</button>
    <button type="button" on:click={copyPrompt} disabled={!generatedPrompt.trim()}>Copy prompt</button>
    {#if copyMessage}
      <span class="success">{copyMessage}</span>
    {/if}
  </div>

  <label>
    <span>Generated prompt</span>
    <textarea class="prompt" bind:value={generatedPrompt} on:input={persistDrafts} placeholder="Prompt output appears here."></textarea>
  </label>

  <label>
    <span>Paste generated SkillTerrain JSON</span>
    <textarea class="json" bind:value={jsonText} on:input={persistDrafts} placeholder={'{"targetRole": ...}'}></textarea>
  </label>

  {#if validationErrors.length}
    <div class="error-box" role="alert">
      <strong>Fix these before saving:</strong>
      <ul>
        {#each validationErrors.slice(0, 12) as error}
          <li>{error}</li>
        {/each}
      </ul>
      {#if validationErrors.length > 12}
        <small>{validationErrors.length - 12} more validation errors hidden.</small>
      {/if}
    </div>
  {/if}

  <div class="action-row">
    <button type="button" class="primary" on:click={saveJson}>Validate and save job</button>
  </div>
</section>
