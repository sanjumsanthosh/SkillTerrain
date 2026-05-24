export type AppView = 'import' | 'heatmap' | 'jobs' | 'compare';

export interface TargetRole {
  title: string;
  company?: string;
  date?: string;
  summary?: string;
}

export interface Requirement {
  id: string;
  label: string;
  category: string;
  description?: string;
  importance?: number;
  roleSignals?: string[];
}

export interface HeatmapColumn {
  id: string;
  label: string;
  description?: string;
  valueHint?: string;
}

export interface HeatmapLens {
  id: string;
  title: string;
  description: string;
  columns: HeatmapColumn[];
}

export interface ScoreCell {
  requirementId: string;
  lensId: string;
  columnId: string;
  score: number;
  scoreLabel?: string;
  summary: string;
  roleEvidence: string[];
  whyGood: string;
  whyGap: string;
  evidence: string[];
  nextActions: string[];
}

export interface HeatmapModel {
  targetRole: TargetRole;
  requirements: Requirement[];
  lenses: HeatmapLens[];
  cells: ScoreCell[];
}

export interface SkillTerrainJob {
  id: string;
  title: string;
  company?: string;
  sourceDescription: string;
  notes?: string;
  heatmap: HeatmapModel;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDrafts {
  title: string;
  company: string;
  description: string;
  notes: string;
  generatedPrompt: string;
  jsonText: string;
}

export interface SkillTerrainWorkspace {
  version: 1;
  jobs: SkillTerrainJob[];
  projects: SkillTerrainJob[];
  activeJobId?: string;
  activeView: AppView;
  drafts: WorkspaceDrafts;
}

export interface CellPointer {
  lensId: string;
  requirementId: string;
  columnId: string;
  pinned: boolean;
}

export interface ActiveCellContext {
  pointer: CellPointer;
  job: SkillTerrainJob;
  lens: HeatmapLens;
  column: HeatmapColumn;
  requirement: Requirement;
  cell: ScoreCell;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  model?: HeatmapModel;
}

export interface ComparisonCell {
  requirementLabel: string;
  lensLabel: string;
  columnLabel: string;
  leftScore?: number;
  rightScore?: number;
  delta?: number;
  status: 'shared' | 'left-only' | 'right-only';
}

export interface ComparisonResult {
  leftJobId: string;
  rightJobId: string;
  cells: ComparisonCell[];
  sharedRequirements: number;
  sharedLenses: number;
}
