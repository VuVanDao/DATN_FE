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
