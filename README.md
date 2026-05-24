# SkillTerrain
SkillTerrain is a personal readiness-mapping tool that turns your skills, projects, evidence, and target-role requirements into interactive heatmaps. It helps you see where you are strong, where your experience transfers, what gaps matter most, and what to build next.

## What it does

SkillTerrain is a browser-only static app. It does not call an LLM or backend directly. Instead:

1. Paste a target job description and optional personal evidence notes.
2. Generate a detailed prompt for your preferred LLM.
3. Paste the returned SkillTerrain JSON into the app.
4. Navigate four compact heatmap lenses: Fit, Evidence, Interview, and Roadmap.
5. Manage multiple saved jobs and compare two terrains locally.

All data is stored in `localStorage`. Use workspace export/import JSON for backups.

Heatmap scores use one consistent signed scale:

- `1` is favorable and green.
- `0` is neutral or mixed.
- `-1` is unfavorable and red.

Columns such as gap, risk, difficulty, or time-to-proof still use that candidate-favorability scale. For example, a hard critical gap should score negative, while an easy fast win should score positive.

Each generated cell separates the role side from the candidate side:

- `roleEvidence`: what the job posting is actually asking for.
- `evidence`: the candidate's project, notes, resume, GitHub, or PRISM proof.
- `whyGap` and `nextActions`: what is missing and what to build next.

## Development

```bash
npm install
npm run dev
npm run check
npm run build
```

The production build is written to `dist/` and uses `base: "./"` so it can be hosted as a static GitHub Pages project site.

## Project structure

```text
src/
  App.svelte
  components/
    AnalysisDrawer.svelte
    CompareView.svelte
    HeatmapGrid.svelte
    ImportJob.svelte
    JobManager.svelte
  lib/
    prompt.ts
    scoring.ts
    storage.ts
    types.ts
    validation.ts
  styles/
    global.css
```

## Privacy model

- No backend server.
- No API keys.
- No network calls from the app.
- Saved maps stay in the current browser profile unless exported by the user.
