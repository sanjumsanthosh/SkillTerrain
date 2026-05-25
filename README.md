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

Each valid heatmap uses the full SkillTerrain matrix contract: 4 required lenses, 24 required columns, and one score cell for every requirement/column pair. The app warns when older or incomplete imports are missing expected cells.

Heatmap cell scores use one consistent signed scale:

- `5` is favorable and green.
- `0` is neutral or mixed.
- `-5` is unfavorable and red.

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

## Sharing a heatmap

SkillTerrain supports encrypted share links so you can send a recruiter a read-only snapshot of a single job heatmap without exposing your data.

Share URLs look like:
```
https://sanjumsanthosh.github.io/SkillTerrain/#a7b8c9d0_mysecretkey15
```

The fragment (`#...`) is never sent to GitHub's servers. Decryption happens entirely in the visitor's browser.

**To generate a share link**, use the companion private repo [terrain-vault](https://github.com/sanjumsanthosh/terrain-vault):

```bash
# 1. Export a single job as JSON from SkillTerrain (Manage Jobs → export)
# 2. In terrain-vault, run:
node tools/encrypt.js --input path/to/job.json --label "Recruiter @ Acme"
# → writes the .enc file to SkillTerrain/public/data/
# → prints your shareable URL
# → logs the entry to .vault-map.json

# 3. Commit and push the .enc file from SkillTerrain
# 4. Share the URL

# Forgot a URL? Look it up:
node tools/list.js --label "Acme"
```

See the [terrain-vault README](https://github.com/sanjumsanthosh/terrain-vault) for full setup and usage instructions.

---

## Privacy model

- No backend server.
- No API keys.
- No network calls from the app.
- Saved maps stay in the current browser profile unless exported by the user.
- Shared `.enc` files are AES-128-GCM encrypted — the hosted file is useless without the key in the URL fragment.
