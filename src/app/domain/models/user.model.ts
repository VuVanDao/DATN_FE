export interface User {
  Id: string;
  Email: string;
  UserName: string;
  AvatarUrl?: string;
  Bio?: string;
  IsActive?: boolean;
  CreatedAt?: string;
  Roles: string[];
}
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isActive?: boolean;
  createdAt?: string;
  roles: string[];
}
export interface ChangePasswordRequest {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmNewPassword: string;
}
export interface UpdateProfileRequest {
  Username: string;
  Bio?: string;
}

export interface LoginHistory {
  Id: string;
  UserId?: string | null;
  EmailAttempted: string;
  IpAddress?: string | null;
  UserAgent?: string | null;
  IsSuccess: boolean;
  FailureReason?: string | null;
  CreatedAt: string;
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
