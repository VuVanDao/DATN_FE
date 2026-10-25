export interface AuthResponseDto {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  token: string;
  role: string;
  refreshToken?: string;
  isActive: boolean;
  refreshTokenExpiresAt?: string;
  createdAt?: string;
}
