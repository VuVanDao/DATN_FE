import { User } from './user.model';

export interface LoginRequest {
  Email: string;
  Password: string;
}
export interface LoginResponse {
  User: User;
  Tokens: AuthTokens;
}
export interface AuthTokens {
  AccessToken: string;
  RefreshToken: string;
  RefreshTokenExpiresAt?: number;
}
export interface RegisterRequest {
  Email: string;
  Password: string;
  Username: string;
}
export interface RegisterResponse extends LoginResponse {}
