export interface User {
  Id: string;
  Email: string;
  UserName: string;
  AvatarUrl?: string;
  Bio?: string;
  IsActive?: boolean;
  Roles: string[];
}
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isActive?: boolean;
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
