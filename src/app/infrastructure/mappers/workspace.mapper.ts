import {
  Workspace,
  WorkspaceDetail,
  WorkspaceDetailResponse,
  WorkspaceProject,
  WorkspaceProjectResponse,
  WorkspaceResponse,
} from '../../domain/models/workspace.model';

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

export class WorkspaceMapper {
  private static getInitial(name?: string | null): string {
    const trimmedName = name?.trim() || 'W';
    const words = trimmedName.split(/\s+/).filter(Boolean);
    return words.length >= 2
      ? (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
      : trimmedName.charAt(0).toUpperCase();
  }
  private static getColor(seed?: string | null): string {
    const safeSeed = seed || 'default';
    const hash = safeSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];
  }
  static toWorkspace(dto: WorkspaceResponse): Workspace {
    return {
      id: dto.id,
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      logoUrl: dto.logoUrl ?? null,
      coverImageUrl: dto.coverImageUrl ?? null,
      ownerId: dto.ownerId,
      ownerName: dto.ownerName,
      membersCount: dto.membersCount ?? 0,
      projectsCount: dto.projectsCount ?? 0,
      currentUserRole: dto.currentUserRole ?? null,
      createdAt: dto.createdAt,
      initial: this.getInitial(dto.name),
      color: this.getColor(dto.id || dto.name),
    };
  }
  static toWorkspaceProject(dto: WorkspaceProjectResponse): WorkspaceProject {
    return {
      id: dto.id,
      name: dto.name,
      projectKey: dto.projectKey,
      description: dto.description ?? null,
      membersCount: dto.membersCount ?? 0,
      tasksCount: dto.tasksCount ?? 0,
      members: dto.members ?? [],
      createdAt: dto.createdAt,
      initial: this.getInitial(dto.name),
      color: this.getColor(dto.id || dto.name),
    };
  }
  static toWorkspaceDetail(dto: WorkspaceDetailResponse): WorkspaceDetail {
    return {
      id: dto.id,
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      logoUrl: dto.logoUrl ?? null,
      coverImageUrl: dto.coverImageUrl ?? null,
      ownerId: dto.ownerId,
      ownerName: dto.ownerName,
      currentUserRole: dto.currentUserRole ?? null,
      createdAt: dto.createdAt,
      members: dto.members ?? [],
      projects: (dto.projects ?? []).map((p) => this.toWorkspaceProject(p)),
      initial: this.getInitial(dto.name),
      color: this.getColor(dto.id || dto.name),
    };
  }
}
