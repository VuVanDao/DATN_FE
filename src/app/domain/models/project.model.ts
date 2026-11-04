export interface CreateProjectRequest {
  workspaceId: string;
  name: string;
  projectKey: string;
  description?: string | null;
  isAssignAsLeader?: boolean;
}

export interface UpdateProjectRequest {
  name: string;
  projectKey: string;
  description?: string | null;
}

export interface Project {
  id: string;
  name: string;
  projectKey: string;
  description?: string | null;
  workspaceId: string;
  workspaceName?: string;
  createdById: string;
  createdByName: string;
  createdByAvatarUrl?: string | null;
  boardsCount: number;
  membersCount: number;
  sprintCount: number;
  cardCount: number;
  createdAt: string;
  isMember?: boolean;
  currentUserRole?: string | null;
}

export interface ProjectMember {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  roleId: string;
  roleName: string;
  jobTitle?: string | null;
  joinedAt: string;
}

export interface ProjectRole {
  id: string;
  name: string;
  description?: string | null;
}

export interface AddProjectMemberEntry {
  userId: string;
  roleId?: string | null;
  jobTitle?: string | null;
}

export interface AddProjectMembersRequest {
  members: AddProjectMemberEntry[];
}

export interface UpdateProjectMemberRoleRequest {
  newRoleId: string;
}

export interface UpdateProjectMemberJobTitleRequest {
  jobTitle?: string | null;
}

export type BoardType = 'Kanban' | 'Scrum';

export interface Board {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  type: string;
  createdAt: string;
  isPinned?: boolean;
  lastViewedAt?: string | null;
}

export interface BoardPreference {
  boardId: string;
  isPinned: boolean;
  lastViewedAt: string;
}

export interface UpdateBoardPreferenceRequest {
  isPinned?: boolean;
  markViewed?: boolean;
}

export interface CreateBoardRequest {
  projectId: string;
  title: string;
  slug: string;
  type: number | string;
}

export interface UpdateBoardRequest {
  title: string;
  slug: string;
  type?: BoardType | string;
}

export interface MyBoardItem {
  boardId: string;
  title: string;
  boardSlug: string;
  projectId: string;
  projectName?: string;
  workspaceName?: string;
  type?: string;
  isPinned: boolean;
  lastViewedAt: string;
}

export interface MyBoards {
  recentBoards: MyBoardItem[];
  pinnedBoards: MyBoardItem[];
}
