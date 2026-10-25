import { Observable } from 'rxjs';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
} from '../models/auth.model';

export abstract class AuthRepository {
  abstract login(request: LoginRequest): Observable<LoginResponse>;
  abstract register(request: RegisterRequest): Observable<RegisterResponse>;
  abstract refreshToken(): Observable<LoginResponse>;
  abstract logout(): Observable<void>;
  abstract forgotPassword(request: ForgotPasswordRequest): Observable<string>;
  abstract resetPassword(request: ResetPasswordRequest): Observable<boolean>;
}
