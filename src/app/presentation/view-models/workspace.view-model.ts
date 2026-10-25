import { Workspace, WorkspaceDetail, WorkspaceProject } from '../../domain/models/workspace.model';

export interface WorkspaceAppearance {
  initial: string;
  color: string;
}
export type WorkspaceView = Workspace & WorkspaceAppearance;
export type WorkspaceProjectView = WorkspaceProject & WorkspaceAppearance;
export type WorkspaceDetailView = Omit<WorkspaceDetail, 'projects'> &
  WorkspaceAppearance & { projects: WorkspaceProjectView[] };

const GRADIENT_PALETTES = [
  'bg-linear-to-br from-purple-500 to-indigo-600',
  'bg-linear-to-br from-blue-500 to-cyan-600',
  'bg-linear-to-br from-emerald-500 to-teal-600',
  'bg-linear-to-br from-amber-500 to-orange-600',
  'bg-linear-to-br from-rose-500 to-pink-600',
  'bg-linear-to-br from-violet-600 to-purple-800',
  'bg-linear-to-br from-sky-500 to-blue-600',
  'bg-linear-to-br from-fuchsia-500 to-pink-600',
];

function appearance(item: { id: string; name: string }): WorkspaceAppearance {
  const name = item.name.trim() || 'W';
  const words = name.split(/\s+/);
  const initial = (
    words.length > 1 ? words[0].charAt(0) + words[1].charAt(0) : name.charAt(0)
  ).toUpperCase();
  const hash = (item.id || name).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return { initial, color: GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length] };
}

export function toWorkspaceView(workspace: Workspace): WorkspaceView {
  return { ...workspace, ...appearance(workspace) };
}

export function toWorkspaceDetailView(workspace: WorkspaceDetail): WorkspaceDetailView {
  return {
    ...workspace,
    ...appearance(workspace),
    projects: workspace.projects.map((project) => ({ ...project, ...appearance(project) })),
  };
}
