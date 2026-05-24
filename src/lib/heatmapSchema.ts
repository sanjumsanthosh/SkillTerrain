import type { HeatmapLens } from './types';

export const REQUIRED_LENSES: HeatmapLens[] = [
  {
    id: 'fit',
    title: 'Fit Lens',
    description: 'Need/current/gap view.',
    columns: [
      { id: 'need-match', label: 'Need Match', description: "Whether the role's need is clearly mapped.", valueHint: '5 clear fit, 0 mixed, -5 weak map' },
      { id: 'current-fit', label: 'Current Fit', description: 'Current evidence-backed fit.', valueHint: '5 strong, 0 mixed, -5 gap' },
      { id: 'evidence-fit', label: 'Evidence Fit', description: 'Strength of direct supporting proof.', valueHint: '5 direct proof, 0 adjacent, -5 missing' },
      { id: 'transfer-fit', label: 'Transfer Fit', description: 'How well adjacent work transfers.', valueHint: '5 strong transfer, 0 mixed, -5 weak' },
      { id: 'portfolio-fit', label: 'Portfolio Fit', description: 'Portfolio readiness.', valueHint: '5 ready proof, 0 mixed, -5 missing' },
      { id: 'gap-control', label: 'Gap Control', description: 'Whether the gap is manageable.', valueHint: '5 controlled, 0 mixed, -5 critical' },
    ],
  },
  {
    id: 'evidence',
    title: 'Evidence Lens',
    description: 'Where proof comes from.',
    columns: [
      { id: 'work-professional', label: 'Work/Professional', description: 'Professional evidence strength.', valueHint: '5 strong, 0 mixed, -5 none' },
      { id: 'github', label: 'GitHub', description: 'GitHub evidence strength.', valueHint: '5 strong, 0 mixed, -5 none' },
      { id: 'notes', label: 'Notes', description: 'Private notes and KB evidence strength.', valueHint: '5 strong, 0 mixed, -5 none' },
      { id: 'learning', label: 'Learning', description: 'Learning/foundation evidence strength.', valueHint: '5 strong, 0 mixed, -5 none' },
      { id: 'public-proof', label: 'Public Proof', description: 'Resume-safe public proof.', valueHint: '5 public, 0 mixed, -5 absent' },
      { id: 'confidence', label: 'Confidence', description: 'Confidence without overclaiming.', valueHint: '5 high, 0 mixed, -5 low' },
    ],
  },
  {
    id: 'interview',
    title: 'Interview Lens',
    description: 'How safe the story is in interviews.',
    columns: [
      { id: 'resume-claim', label: 'Resume Claim', description: 'Strength of claim to put on resume.', valueHint: '5 strong, 0 cautious, -5 avoid' },
      { id: 'story', label: 'Story', description: 'Ability to tell a concrete project story.', valueHint: '5 concrete, 0 mixed, -5 weak' },
      { id: 'explainability', label: 'Explainability', description: 'Ability to explain tradeoffs clearly.', valueHint: '5 strong, 0 mixed, -5 weak' },
      { id: 'risk-control', label: 'Risk Control', description: 'Risk of overclaiming is controlled.', valueHint: '5 safe, 0 mixed, -5 risky' },
      { id: 'proof-coverage', label: 'Proof Coverage', description: 'Coverage of evidence for claims.', valueHint: '5 covered, 0 partial, -5 absent' },
      { id: 'safe-wording', label: 'Safe Wording', description: 'Can be worded honestly.', valueHint: '5 easy, 0 careful, -5 avoid' },
    ],
  },
  {
    id: 'roadmap',
    title: 'Roadmap Lens',
    description: 'What to build next.',
    columns: [
      { id: 'fast-win', label: 'Fast Win', description: 'Can improve quickly.', valueHint: '5 fast, 0 mixed, -5 slow' },
      { id: 'resume-impact', label: 'Resume Impact', description: 'Value if improved.', valueHint: '5 high, 0 mixed, -5 low' },
      { id: 'difficulty', label: 'Difficulty', description: 'Candidate-favorable inverse of difficulty.', valueHint: '5 easy, 0 moderate, -5 very hard' },
      { id: 'time-to-proof', label: 'Time to Proof', description: 'Candidate-favorable inverse of time.', valueHint: '5 short, 0 medium, -5 long' },
      { id: 'portfolio-value', label: 'Portfolio Value', description: 'Value of making proof public.', valueHint: '5 high, 0 mixed, -5 low' },
      { id: 'priority-fit', label: 'Priority Fit', description: 'Priority for this target role.', valueHint: '5 high, 0 mixed, -5 low' },
    ],
  },
];

export function expandRequiredLenses(lenses: HeatmapLens[]): HeatmapLens[] {
  const required = REQUIRED_LENSES.map((requiredLens) => {
    const actualLens = findMatchingLens(lenses, requiredLens);
    if (!actualLens) {
      return requiredLens;
    }

    const requiredColumns = requiredLens.columns.map(
      (requiredColumn) => findMatchingColumn(actualLens, requiredColumn) ?? requiredColumn,
    );
    const extraColumns = actualLens.columns.filter(
      (column) => !requiredLens.columns.some((requiredColumn) => sameColumn(column, requiredColumn)),
    );

    return {
      ...requiredLens,
      ...actualLens,
      description: actualLens.description || requiredLens.description,
      columns: [...requiredColumns, ...extraColumns],
    };
  });

  const extras = lenses.filter((lens) => !REQUIRED_LENSES.some((requiredLens) => sameLens(lens, requiredLens)));
  return [...required, ...extras];
}

export function findRequiredSchemaGaps(lenses: HeatmapLens[]): string[] {
  const gaps: string[] = [];

  for (const requiredLens of REQUIRED_LENSES) {
    const actualLens = findMatchingLens(lenses, requiredLens);
    if (!actualLens) {
      gaps.push(`Missing required lens: ${requiredLens.title}.`);
      continue;
    }

    for (const requiredColumn of requiredLens.columns) {
      if (!findMatchingColumn(actualLens, requiredColumn)) {
        gaps.push(`Missing required column: ${requiredLens.title} / ${requiredColumn.label}.`);
      }
    }
  }

  return gaps;
}

function findMatchingLens(lenses: HeatmapLens[], requiredLens: HeatmapLens): HeatmapLens | undefined {
  return lenses.find((lens) => sameLens(lens, requiredLens));
}

function findMatchingColumn(lens: HeatmapLens, requiredColumn: HeatmapLens['columns'][number]): HeatmapLens['columns'][number] | undefined {
  return lens.columns.find((column) => sameColumn(column, requiredColumn));
}

function sameLens(lens: HeatmapLens, requiredLens: HeatmapLens): boolean {
  return normalize(lens.id) === normalize(requiredLens.id) || normalize(lens.title) === normalize(requiredLens.title);
}

function sameColumn(column: HeatmapLens['columns'][number], requiredColumn: HeatmapLens['columns'][number]): boolean {
  return normalize(column.id) === normalize(requiredColumn.id) || normalize(column.label) === normalize(requiredColumn.label);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
