export interface Workspace {
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
  coverImageUrl?: string | null;
  ownerId: string;
  ownerName: string;
  membersCount: number;
  projectsCount: number;
  currentUserRole?: string | null;
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string | null;
}

// Model thành viên trong Workspace
export interface WorkspaceMember {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  roleId: string;
  roleName: string;
  joinAt: string;
}

// Avatar của thành viên trong từng Project
export interface ProjectMemberAvatar {
  userId: string;
  username: string;
  avatarUrl?: string | null;
}

// Model Project hiển thị trong Tab Dự án
export interface WorkspaceProject {
  id: string;
  name: string;
  projectKey: string;
  description?: string | null;
  membersCount: number;
  tasksCount: number;
  members: ProjectMemberAvatar[];
  createdAt: string;
  initial: string;
  color: string;
}

// Response từ Backend cho từng Project
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

// Response chi tiết Workspace từ API GET/PUT
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
  members: WorkspaceMember[];
  projects: WorkspaceProjectResponse[];
}

// Model chi tiết Workspace dùng cho UI
export interface WorkspaceDetail {
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
  members: WorkspaceMember[];
  projects: WorkspaceProject[];
  initial: string;
  color: string;
}

// Request cập nhật thông tin cài đặt Workspace (Tab Cài đặt - ảnh 3)
export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string | null;
  logo?: File | null;
  coverImage?: File | null;
}
