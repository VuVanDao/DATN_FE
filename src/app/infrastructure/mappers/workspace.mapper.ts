import { Workspace, WorkspaceResponse } from '../../domain/models/workspace.model';

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
  static toWorkspace(dto: WorkspaceResponse): Workspace {
    const trimmedName = dto.name?.trim() || 'Workspace';
    const initial = trimmedName.charAt(0).toUpperCase();

    // Xác định màu sắc ổn định dựa trên id hoặc tên của workspace
    const hash = (dto.id || trimmedName).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];

    return {
      id: dto.id,
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      logoUrl: dto.logoUrl ?? null,
      ownerId: dto.ownerId,
      ownerName: dto.ownerName,
      membersCount: dto.membersCount ?? 0,
      projectsCount: dto.projectsCount ?? 0,
      currentUserRole: dto.currentUserRole ?? null,
      createdAt: dto.createdAt,
      initial,
      color,
    };
  }
}
