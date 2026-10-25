import { ProjectMemberAvatar } from '../../domain/models/workspace.model';

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  ownerId: string;
  ownerName: string;
  membersCount: number;
  projectsCount: number;
  currentUserRole?: string | null;
  createdAt: string;
}
export interface WorkspaceProjectResponse {
  id: string;
  name: string;
  projectKey: string;
  description?: string | null;
  membersCount: number;
  tasksCount: number;
  members: ProjectMemberAvatar[];
  createdAt: string;
}
export interface WorkspaceDetailResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  ownerId: string;
  ownerName: string;
  currentUserRole?: string | null;
  createdAt: string;
  membersCount: number;
  memberPreview: ProjectMemberAvatar[];
}
