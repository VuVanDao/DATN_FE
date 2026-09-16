export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | Record<string, string[]> | null;
}
export interface AuthResponseDto {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  token: string;
  roles: string[];
  refreshToken?: string;
  isActive: boolean;
  refreshTokenExpiresAt?: string;
  createdAt?: string;
}
