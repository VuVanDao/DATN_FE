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
}

// endpoint tao workspace moi
export interface CreateWorkspaceRequest {
  name: string;
  description?: string | null;
}

// Model thông tin thành viên trong Workspace
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
  isMember?: boolean;
}

// Chi tiết workspace được repository trả về.
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
  membersCount: number;
  memberPreview: ProjectMemberAvatar[];
}

// Input cập nhật thông tin và tệp upload của workspace.
export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string | null;
  logo?: File | null;
  coverImage?: File | null;
}
// ---- model cho usecase add member to workspace --------
// danh sach cac role scope workspace
export interface WorkspaceRole {
  id: string;
  name: string;
  description?: string | null;
}
// dai dien cho 1 thanh vien trong list duoc add vao workspace
export interface MemberInviteEntry {
  email: string;
  roleId?: string | null;
}
// Request gửi lên API
export interface AddWorkspaceMembersRequest {
  members: MemberInviteEntry[];
}
// Kết quả của từng email
export interface MemberAddResult {
  email: string;
  success: boolean;
  message?: string | null;
  member?: WorkspaceMember | null;
}
// Response tổng hợp từ Backend
export interface AddWorkspaceMembersResult {
  totalRequested: number;
  totalSuccess: number;
  totalFailed: number;
  results: MemberAddResult[];
}

// Thông tin dự án mà member đang làm Trưởng dự án (Project Leader)
export interface LeaderProject {
  projectId: string;
  projectName: string;
}

export interface MemberRemovalImpact {
  memberId: string;
  isProjectLeader: boolean;
  assignedCardsCount: number;
  leaderProjects: LeaderProject[];
}
