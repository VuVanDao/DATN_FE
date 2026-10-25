import { Workspace, WorkspaceDetail, WorkspaceProject } from '../../domain/models/workspace.model';
import {
  WorkspaceDetailResponse,
  WorkspaceProjectResponse,
  WorkspaceResponse,
} from '../dtos/workspace.dto';

export class WorkspaceMapper {
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
      membersCount: dto.membersCount,
      memberPreview: dto.memberPreview ?? [],
    };
  }
}
