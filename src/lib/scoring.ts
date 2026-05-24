import type {
  ActiveCellContext,
  ComparisonCell,
  ComparisonResult,
  HeatmapModel,
  ScoreCell,
  SkillTerrainJob,
} from './types';

export function getCell(model: HeatmapModel, requirementId: string, lensId: string, columnId: string): ScoreCell | undefined {
  return model.cells.find(
    (cell) => cell.requirementId === requirementId && cell.lensId === lensId && cell.columnId === columnId,
  );
}

export function getActiveCell(job: SkillTerrainJob, lensId: string, requirementId: string, columnId: string): ActiveCellContext | undefined {
  const lens = job.heatmap.lenses.find((item) => item.id === lensId);
  const requirement = job.heatmap.requirements.find((item) => item.id === requirementId);
  const column = lens?.columns.find((item) => item.id === columnId);
  const cell = getCell(job.heatmap, requirementId, lensId, columnId);

  if (!lens || !requirement || !column || !cell) {
    return undefined;
  }

  return {
    pointer: { lensId, requirementId, columnId, pinned: false },
    job,
    lens,
    column,
    requirement,
    cell,
  };
}

export function scoreColor(score: number): string {
  const bounded = Math.max(-5, Math.min(5, score));
  if (bounded <= -3.75) return '#9a3412';
  if (bounded <= -2.5) return '#ea580c';
  if (bounded < -0.75) return '#fdba74';
  if (bounded < 0.75) return '#f8fafc';
  if (bounded < 2.5) return '#bbf7d0';
  if (bounded < 3.75) return '#22c55e';
  return '#166534';
}

export function textColor(score: number): string {
  if (score >= 2.5 || score <= -2.5) return '#f8fafc';
  return '#172033';
}

export function readinessScore(model: HeatmapModel): number {
  const currentCells = model.cells.filter((cell) => /current|confidence|claim|portfolio|evidence|transfer/i.test(cell.columnId));
  if (!currentCells.length) {
    return 0;
  }

  const average = currentCells.reduce((sum, cell) => sum + cell.score, 0) / currentCells.length;
  return Math.round(((average + 5) / 10) * 100);
}

export function compareJobs(left: SkillTerrainJob, right: SkillTerrainJob): ComparisonResult {
  const leftRequirementMap = mapByNormalizedLabel(left.heatmap.requirements);
  const rightRequirementMap = mapByNormalizedLabel(right.heatmap.requirements);
  const leftLensMap = mapByNormalizedTitle(left.heatmap.lenses);
  const rightLensMap = mapByNormalizedTitle(right.heatmap.lenses);
  const cells: ComparisonCell[] = [];

  for (const [requirementKey, leftRequirement] of leftRequirementMap) {
    const rightRequirement = rightRequirementMap.get(requirementKey);
    if (!rightRequirement) {
      cells.push({
        requirementLabel: leftRequirement.label,
        lensLabel: 'All',
        columnLabel: 'Requirement',
        leftScore: -5,
        status: 'left-only',
      });
      continue;
    }

    for (const [lensKey, leftLens] of leftLensMap) {
      const rightLens = rightLensMap.get(lensKey);
      if (!rightLens) {
        continue;
      }

      for (const leftColumn of leftLens.columns) {
        const rightColumn = rightLens.columns.find((column) => normalize(column.label) === normalize(leftColumn.label));
        if (!rightColumn) {
          continue;
        }

        const leftCell = getCell(left.heatmap, leftRequirement.id, leftLens.id, leftColumn.id);
        const rightCell = getCell(right.heatmap, rightRequirement.id, rightLens.id, rightColumn.id);
        if (!leftCell || !rightCell) {
          continue;
        }

        cells.push({
          requirementLabel: leftRequirement.label,
          lensLabel: leftLens.title,
          columnLabel: leftColumn.label,
          leftScore: leftCell.score,
          rightScore: rightCell.score,
          delta: rightCell.score - leftCell.score,
          status: 'shared',
        });
      }
    }
  }

  for (const [requirementKey, rightRequirement] of rightRequirementMap) {
    if (!leftRequirementMap.has(requirementKey)) {
      cells.push({
        requirementLabel: rightRequirement.label,
        lensLabel: 'All',
        columnLabel: 'Requirement',
        rightScore: 5,
        status: 'right-only',
      });
    }
  }

  return {
    leftJobId: left.id,
    rightJobId: right.id,
    cells,
    sharedRequirements: [...leftRequirementMap.keys()].filter((key) => rightRequirementMap.has(key)).length,
    sharedLenses: [...leftLensMap.keys()].filter((key) => rightLensMap.has(key)).length,
  };
}

export function deltaColor(cell: ComparisonCell): string {
  if (cell.status === 'left-only') return '#fef3c7';
  if (cell.status === 'right-only') return '#dbeafe';
  const delta = cell.delta ?? 0;
  if (delta >= 2.5) return '#166534';
  if (delta > 0.5) return '#86efac';
  if (delta === 0) return '#f1f5f9';
  if (delta <= -2.5) return '#9a3412';
  return '#fed7aa';
}

export function deltaText(cell: ComparisonCell): string {
  if (cell.status === 'left-only') return 'A only';
  if (cell.status === 'right-only') return 'B only';
  const delta = cell.delta ?? 0;
  return delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
}

function mapByNormalizedLabel<T extends { label: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [normalize(item.label), item]));
}

function mapByNormalizedTitle<T extends { title: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [normalize(item.title), item]));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
