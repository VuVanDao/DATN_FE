export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isActive?: boolean;
  createdAt?: string;
  role: string;
}
export interface LoginHistoryResponse {
  id: string;
  userId?: string | null;
  emailAttempted: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  isSuccess: boolean;
  failureReason?: string | null;
  createdAt: string;
}
