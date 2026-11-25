export interface UserManagementResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isActive?: boolean;
  createdAt?: string;
  role: string;
  isDeleted: boolean;
}
