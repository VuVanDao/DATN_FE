export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  ownerId: string;
  ownerName: string;
  membersCount: number;
  projectsCount: number;
  currentUserRole?: string | null;
  createdAt: string;
  // Các trường bổ trợ hiển thị trên giao diện (UI)
  initial: string;
  color: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  ownerId: string;
  ownerName: string;
  membersCount: number;
  projectsCount: number;
  currentUserRole?: string | null;
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  logoUrl?: string;
}
