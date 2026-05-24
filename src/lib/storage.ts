import type { AppView, SkillTerrainJob, SkillTerrainWorkspace, WorkspaceDrafts } from './types';

const STORAGE_KEY = 'skillterrain.workspace.v1';

const emptyDrafts = (): WorkspaceDrafts => ({
  title: '',
  company: '',
  description: '',
  notes: '',
  generatedPrompt: '',
  jsonText: '',
});

export const createEmptyWorkspace = (): SkillTerrainWorkspace => ({
  version: 1,
  jobs: [],
  projects: [],
  activeView: 'import',
  drafts: emptyDrafts(),
});

export const createId = (prefix = 'job'): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function loadWorkspace(): SkillTerrainWorkspace {
  if (typeof localStorage === 'undefined') {
    return createEmptyWorkspace();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyWorkspace();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SkillTerrainWorkspace>;
    return normalizeWorkspace(parsed);
  } catch {
    return createEmptyWorkspace();
  }
}

export function saveWorkspace(workspace: SkillTerrainWorkspace): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeWorkspace(workspace)));
}

export function normalizeWorkspace(input: Partial<SkillTerrainWorkspace>): SkillTerrainWorkspace {
  const workspace = createEmptyWorkspace();
  const jobs = Array.isArray(input.jobs) ? input.jobs.filter(isJobLike) : [];
  const projects = Array.isArray(input.projects) ? input.projects.filter(isJobLike) : [];
  const activeView = isAppView(input.activeView) ? input.activeView : workspace.activeView;
  const activeJobId =
    typeof input.activeJobId === 'string' && jobs.some((job) => job.id === input.activeJobId)
      ? input.activeJobId
      : jobs[0]?.id;

  return {
    version: 1,
    jobs,
    projects,
    activeJobId,
    activeView,
    drafts: {
      ...workspace.drafts,
      ...(input.drafts && typeof input.drafts === 'object' ? input.drafts : {}),
    },
  };
}

export function upsertJob(workspace: SkillTerrainWorkspace, job: SkillTerrainJob): SkillTerrainWorkspace {
  const jobs = workspace.jobs.some((item) => item.id === job.id)
    ? workspace.jobs.map((item) => (item.id === job.id ? job : item))
    : [job, ...workspace.jobs];

  return {
    ...workspace,
    jobs,
    activeJobId: job.id,
    activeView: 'heatmap',
  };
}

export function updateDrafts(
  workspace: SkillTerrainWorkspace,
  drafts: Partial<WorkspaceDrafts>,
): SkillTerrainWorkspace {
  return {
    ...workspace,
    drafts: {
      ...workspace.drafts,
      ...drafts,
    },
  };
}

export function setActiveView(workspace: SkillTerrainWorkspace, activeView: AppView): SkillTerrainWorkspace {
  return {
    ...workspace,
    activeView,
  };
}

export function deleteJob(workspace: SkillTerrainWorkspace, jobId: string): SkillTerrainWorkspace {
  const jobs = workspace.jobs.filter((job) => job.id !== jobId);
  const activeJobId = workspace.activeJobId === jobId ? jobs[0]?.id : workspace.activeJobId;
  return {
    ...workspace,
    jobs,
    activeJobId,
    activeView: jobs.length ? workspace.activeView : 'import',
  };
}

export function exportWorkspace(workspace: SkillTerrainWorkspace): string {
  return JSON.stringify(normalizeWorkspace(workspace), null, 2);
}

export function importWorkspace(raw: string): SkillTerrainWorkspace {
  const parsed = JSON.parse(raw) as Partial<SkillTerrainWorkspace>;
  return normalizeWorkspace(parsed);
}

function isAppView(value: unknown): value is AppView {
  return value === 'import' || value === 'heatmap' || value === 'jobs' || value === 'compare';
}

function isJobLike(value: unknown): value is SkillTerrainJob {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SkillTerrainJob;
  return Boolean(
    typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      candidate.heatmap &&
      Array.isArray(candidate.heatmap.requirements) &&
      Array.isArray(candidate.heatmap.lenses) &&
      Array.isArray(candidate.heatmap.cells),
  );
}
