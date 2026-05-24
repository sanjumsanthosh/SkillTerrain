import { findRequiredSchemaGaps } from './heatmapSchema';
import type { HeatmapModel, ValidationResult } from './types';

const REQUIRED_TOP_LEVEL = ['targetRole', 'requirements', 'lenses', 'cells'] as const;

export function validateHeatmapJson(raw: string): ValidationResult {
  if (!raw.trim()) {
    return { ok: false, errors: ['Paste a generated SkillTerrain JSON object before saving.'] };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const model = unwrapModel(parsed);
    return validateHeatmapModel(model);
  } catch (error) {
    return {
      ok: false,
      errors: [`JSON could not be parsed: ${error instanceof Error ? error.message : 'unknown parse error'}`],
    };
  }
}

export function validateHeatmapModel(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['Heatmap JSON must be an object.'] };
  }

  const model = input as HeatmapModel;
  for (const key of REQUIRED_TOP_LEVEL) {
    if (!(key in model)) {
      errors.push(`Missing top-level field: ${key}.`);
    }
  }

  if (!model.targetRole || typeof model.targetRole.title !== 'string' || !model.targetRole.title.trim()) {
    errors.push('targetRole.title is required.');
  }

  if (!Array.isArray(model.requirements) || model.requirements.length === 0) {
    errors.push('At least one requirement is required.');
  }

  if (!Array.isArray(model.lenses) || model.lenses.length === 0) {
    errors.push('At least one lens is required.');
  }

  if (!Array.isArray(model.cells) || model.cells.length === 0) {
    errors.push('At least one score cell is required.');
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  const requirementIds = new Set<string>();
  for (const requirement of model.requirements) {
    if (!isNonEmptyString(requirement.id)) errors.push('Every requirement needs a non-empty id.');
    if (!isNonEmptyString(requirement.label)) errors.push('Every requirement needs a non-empty label.');
    if (!isNonEmptyString(requirement.category)) errors.push(`Requirement ${requirement.id || '(missing id)'} needs a category.`);
    if (requirement.roleSignals !== undefined && (!Array.isArray(requirement.roleSignals) || !requirement.roleSignals.every(isNonEmptyString))) {
      errors.push(`Requirement ${requirement.label || requirement.id} roleSignals must be non-empty strings.`);
    }
    if (typeof requirement.importance === 'number' && !isImportance(requirement.importance)) {
      errors.push(`Requirement ${requirement.label || requirement.id} importance must be 0-5.`);
    }
    if (requirementIds.has(requirement.id)) errors.push(`Duplicate requirement id: ${requirement.id}.`);
    requirementIds.add(requirement.id);
  }

  const lensColumnKeys = new Set<string>();
  const lensIds = new Set<string>();
  for (const lens of model.lenses) {
    if (!isNonEmptyString(lens.id)) errors.push('Every lens needs a non-empty id.');
    if (!isNonEmptyString(lens.title)) errors.push(`Lens ${lens.id || '(missing id)'} needs a title.`);
    if (!Array.isArray(lens.columns) || lens.columns.length === 0) {
      errors.push(`Lens ${lens.id || '(missing id)'} needs at least one column.`);
      continue;
    }
    if (lensIds.has(lens.id)) errors.push(`Duplicate lens id: ${lens.id}.`);
    lensIds.add(lens.id);

    const columnIds = new Set<string>();
    for (const column of lens.columns) {
      if (!isNonEmptyString(column.id)) errors.push(`Lens ${lens.id} has a column without an id.`);
      if (!isNonEmptyString(column.label)) errors.push(`Lens ${lens.id} column ${column.id || '(missing id)'} needs a label.`);
      if (column.valueHint !== undefined && !isNonEmptyString(column.valueHint)) errors.push(`Lens ${lens.id} column ${column.id} valueHint must be a non-empty string.`);
      if (columnIds.has(column.id)) errors.push(`Duplicate column id ${column.id} in lens ${lens.id}.`);
      columnIds.add(column.id);
      lensColumnKeys.add(`${lens.id}:${column.id}`);
    }
  }

  errors.push(...findRequiredSchemaGaps(model.lenses));

  const cellKeys = new Set<string>();
  for (const cell of model.cells) {
    const key = `${cell.requirementId}:${cell.lensId}:${cell.columnId}`;
    if (!requirementIds.has(cell.requirementId)) errors.push(`Cell references unknown requirement: ${cell.requirementId}.`);
    if (!lensColumnKeys.has(`${cell.lensId}:${cell.columnId}`)) {
      errors.push(`Cell references unknown lens/column: ${cell.lensId}/${cell.columnId}.`);
    }
    if (!isScore(cell.score)) errors.push(`Cell ${key} score must be between -5 and 5.`);
    if (cell.scoreLabel !== undefined && !isNonEmptyString(cell.scoreLabel)) errors.push(`Cell ${key} scoreLabel must be a non-empty string.`);
    if (!isNonEmptyString(cell.summary)) errors.push(`Cell ${key} needs a summary.`);
    if (!Array.isArray(cell.roleEvidence) || cell.roleEvidence.length === 0 || !cell.roleEvidence.every(isNonEmptyString)) {
      errors.push(`Cell ${key} needs roleEvidence with the job-posting need or task.`);
    }
    if (!isNonEmptyString(cell.whyGood)) errors.push(`Cell ${key} needs whyGood.`);
    if (!isNonEmptyString(cell.whyGap)) errors.push(`Cell ${key} needs whyGap.`);
    if (!Array.isArray(cell.evidence) || cell.evidence.length === 0) {
      errors.push(`Cell ${key} needs at least one evidence item.`);
    } else if (!cell.evidence.every(isNonEmptyString)) {
      errors.push(`Cell ${key} evidence items must be non-empty strings.`);
    }
    if (!Array.isArray(cell.nextActions) || cell.nextActions.length === 0) {
      errors.push(`Cell ${key} needs at least one next action.`);
    } else if (!cell.nextActions.every(isNonEmptyString)) {
      errors.push(`Cell ${key} nextActions must be non-empty strings.`);
    }
    if (cellKeys.has(key)) errors.push(`Duplicate cell: ${key}.`);
    cellKeys.add(key);
  }

  for (const requirement of model.requirements) {
    for (const key of lensColumnKeys) {
      const [lensId, columnId] = key.split(':');
      const cellKey = `${requirement.id}:${lensId}:${columnId}`;
      if (!cellKeys.has(cellKey)) {
        errors.push(`Missing cell for ${requirement.label} / ${lensId} / ${columnId}.`);
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, errors: [], model };
}

function unwrapModel(input: unknown): unknown {
  if (input && typeof input === 'object' && 'heatmap' in input) {
    return (input as { heatmap: unknown }).heatmap;
  }

  return input;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -5 && value <= 5;
}

function isImportance(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5;
}
