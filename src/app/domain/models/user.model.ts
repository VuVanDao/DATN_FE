export interface User {
  id: string;
  email: string;
  userName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isActive?: boolean;
  createdAt?: string;
  role: string;
}
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
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
export interface UpdateProfileRequest {
  username: string;
  bio?: string;
}

export interface LoginHistory {
  id: string;
  userId?: string | null;
  emailAttempted: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  isSuccess: boolean;
  failureReason?: string | null;
  createdAt: string;
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
