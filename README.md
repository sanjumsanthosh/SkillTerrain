<div align="center">

# 🗺️ SkillTerrain

**Turn a job description into a heatmap of what you have, what transfers, and what to build next.**

A browser‑only readiness map: paste a role, generate a structured analysis with your own LLM,
and read the result as four lenses — Fit, Evidence, Interview, Roadmap.

<br>

[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![No backend](https://img.shields.io/badge/backend-none-brightgreen)](#privacy-model)
[![No API keys](https://img.shields.io/badge/API%20keys-none-brightgreen)](#privacy-model)
[![Hosted](https://img.shields.io/badge/hosted-GitHub%20Pages-222)](https://sanjumsanthosh.github.io/SkillTerrain/)

**▶ [Open SkillTerrain](https://sanjumsanthosh.github.io/SkillTerrain/)**

</div>

---

## The idea

Most career tools tell you a percentage. SkillTerrain shows you the *terrain*: 24 requirement ×
lens cells per role, scored on one consistent scale, with the role's actual demand separated
from your actual evidence.

- **Green (`5`)** — favorable: strong evidence, easy gap to close, low risk.
- **Neutral (`0`)** — mixed or unknown.
- **Red (`-5`)** — unfavorable: critical gap, hard to prove, high risk.

Columns like *gap*, *risk*, *difficulty* and *time‑to‑proof* use the same candidate‑favorability
scale, so a hard critical gap scores negative and a fast win scores positive — one mental model
for the whole grid.

## How it works

SkillTerrain never calls an LLM. You bring the model, it brings the contract.

1. **Paste a target job description** (plus optional evidence notes) and generate a prompt.
2. **Run that prompt in your LLM of choice.**
3. **Paste the returned JSON back** into the app.
4. **Read the heatmap** through four lenses and open any cell for the full reasoning.

Every cell separates the two sides of the question:

| Field | Meaning |
|---|---|
| `roleEvidence` | What the posting is actually asking for |
| `evidence` | Your proof — project, note, résumé, GitHub, PRISM |
| `whyGap` | What is missing, precisely |
| `nextActions` | What to build or say next |

The app validates the full matrix contract on import — **4 lenses, 24 columns, one score cell per
requirement/column pair** — and warns loudly when an older or incomplete response is missing
expected cells, rather than silently showing a half‑empty map.

## Four lenses

| Lens | The question it answers |
|---|---|
| **Fit** | How close is this role to what I already am? |
| **Evidence** | Can I prove each claim with something real? |
| **Interview** | What will they probe, and where will I stumble? |
| **Roadmap** | What do I build next, in what order? |

Manage multiple jobs locally and open **Compare** to see two terrains side by side, including
how many lenses they share.

## Sharing a map

Yes — without a server, without an account, and without handing your data to anyone.

SkillTerrain supports **AES‑128‑GCM encrypted share links**: the encrypted file is hosted, the key
lives in the URL fragment (`#...`), and the fragment is never sent to GitHub's servers. Decryption
happens in the visitor's browser.

```
https://sanjumsanthosh.github.io/SkillTerrain/#<id>_<key>
```

Generate links with the companion private repo **[terrain-vault](https://github.com/sanjumsanthosh/terrain-vault)**:

```bash
# 1. Export a single job from SkillTerrain (Manage Jobs → export)
# 2. Encrypt it and get a URL
node tools/encrypt.js --input path/to/job.json --label "Recruiter @ Acme"
#    → writes the .enc file to SkillTerrain/public/data/
#    → prints the shareable URL
#    → logs the entry to .vault-map.json

# 3. Commit + push the .enc file from SkillTerrain, then share the URL

# Lost a URL? Look it up by label
node tools/list.js --label "Acme"
```

## Run it

```bash
git clone https://github.com/sanjumsanthosh/SkillTerrain
cd SkillTerrain
npm install
npm run dev      # vite dev server
npm run check    # svelte-check + TypeScript
npm run build    # static build in dist/
```

The production build sets `base: "./"`, so `dist/` works as a GitHub Pages **project site**
with no path configuration.

## Project structure

```text
src/
  App.svelte              shell, view routing, workspace import/export
  components/
    HeatmapGrid.svelte    the grid, keyboard navigation, missing-cell warnings
    AnalysisDrawer.svelte one cell: role demand, your evidence, the gap, next actions
    CompareView.svelte    two terrains, shared lenses
    ImportJob.svelte      JSON import + validation
    JobManager.svelte     saved jobs
  lib/
    heatmapSchema.ts      4 lenses, 24 columns, gap detection
    scoring.ts            signed scale, aggregation
    prompt.ts             the prompt you take to your LLM
    validation.ts         import contract
    storage.ts            localStorage persistence
  styles/global.css
```

## Privacy model

- No backend server, no API keys, no network calls from the app.
- Saved maps live in the current browser profile until you export them.
- Shared `.enc` files are useless without the key in the URL fragment — and fragments are
  never transmitted in HTTP requests.

## Status

Personal tool, actively used. Built with Svelte 5 + Vite, no runtime dependencies beyond Svelte.

## Author

[@sanjumsanthosh](https://github.com/sanjumsanthosh)
