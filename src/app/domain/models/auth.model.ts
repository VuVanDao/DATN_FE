import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: number;
}
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}
export interface RegisterResponse extends LoginResponse {}
export interface ForgotPasswordRequest {
  email: string;
}
export interface ResetPasswordRequest extends ForgotPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}
