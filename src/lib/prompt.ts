import type { WorkspaceDrafts } from './types';

export function generateHeatmapPrompt(drafts: WorkspaceDrafts): string {
  const title = drafts.title.trim() || 'Target Role';
  const company = drafts.company.trim() || 'Target Organization';
  const description = drafts.description.trim() || '[Paste the full job description here]';
  const notes = drafts.notes.trim() || 'No additional personal evidence notes were provided.';

  return `You are generating a SkillTerrain heatmap JSON model.

Goal:
Compare my current evidence-backed skills against this target role. Be honest, do not inflate experience, and clearly separate direct proof from transferable experience.

Target role:
- Title: ${title}
- Company/context: ${company}

Job description:
${description}

My optional notes/evidence:
${notes}

Return ONLY valid JSON matching this TypeScript-like shape:

{
  "targetRole": {
    "title": "string",
    "company": "string",
    "date": "YYYY-MM-DD",
    "summary": "short role-fit summary"
  },
  "requirements": [
    {
      "id": "slug",
      "label": "short requirement label",
      "category": "category/group",
      "description": "what this requirement means",
      "importance": 0,
      "roleSignals": ["short paraphrased or lightly quoted job-posting task this row is based on"]
    }
  ],
  "lenses": [
    {
      "id": "fit",
      "title": "Fit Lens",
      "description": "Need/current/gap view",
      "columns": [
        { "id": "need", "label": "Need Match", "description": "whether the role's need is clearly understood and mapped to this requirement", "valueHint": "5 means highly favorable; 0 means mixed; -5 means critical gap" }
      ]
    }
  ],
  "cells": [
    {
      "requirementId": "must match a requirement id",
      "lensId": "must match a lens id",
      "columnId": "must match a lens column id",
      "score": 0,
      "scoreLabel": "optional human label like strong fit, adjacent proof, critical gap, or hard proof",
      "summary": "one-line explanation",
      "roleEvidence": ["what the posting explicitly needs for this requirement/metric"],
      "whyGood": "what evidence supports this score",
      "whyGap": "what is weak, missing, risky, or unproven",
      "evidence": ["safe private or public evidence label"],
      "nextActions": ["specific action to improve this cell"]
    }
  ]
}

Required lenses and columns:
1. Fit Lens: Need Match, Current Fit, Evidence Fit, Transfer Fit, Portfolio Fit, Gap Control.
2. Evidence Lens: Work/Professional, GitHub, Notes, Learning, Public Proof, Confidence.
3. Interview Lens: Resume Claim, Story, Explainability, Risk Control, Proof Coverage, Safe Wording.
4. Roadmap Lens: Fast Win, Resume Impact, Difficulty, Time to Proof, Portfolio Value, Priority Fit.

Scoring rules:
- Requirement importance is role-side criticality only: use 0 to 5, never negative.
- Use signed numeric scores from -5 to 5.
- A score of 5 always means favorable/green for the candidate.
- A score of 0 means neutral, unclear, or mixed.
- A score of -5 always means unfavorable/red for the candidate.
- For columns that sound negative, such as Gap, Risk, Difficulty, or Time to Proof, score the candidate-favorable inverse. Example: a hard critical gap is -5; an easy manageable gap is 5.
- Put the raw meaning in summary or scoreLabel when helpful, for example "high difficulty" with score -4, or "fast win" with score 4.
- Every requirement must have one cell for every lens column.
- Every cell must include roleEvidence that anchors the score to the job posting's actual need/task. This is separate from my personal evidence.
- Include 12-30 role requirements. Keep labels short enough for heatmap headers.
- Do not include secrets, private URLs, emails, IDs, tracking-system links, client-identifying details, or confidential text.
- Output JSON only. No Markdown fences.`;
}
