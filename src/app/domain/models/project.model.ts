export interface CreateProjectRequest {
  workspaceId: string;
  name: string;
  projectKey: string;
  description?: string | null;
  isAssignAsLeader?: boolean;
}
export interface Project {
  id: string;
  name: string;
  projectKey: string;
  description?: string | null;
  workspaceId: string;
  createdById: string;
  createdByName: string;
  boardsCount: number;
  membersCount: number;
  sprintCount: number;
  createdAt: string;
}
