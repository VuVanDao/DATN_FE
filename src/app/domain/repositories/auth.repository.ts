import { Observable } from 'rxjs';
import {
  AuthTokens,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../models/auth.model';
import { User } from '../models/user.model';

export abstract class AuthRepository {
  abstract Login(request: LoginRequest): Observable<LoginResponse>;
  abstract Register(request: RegisterRequest): Observable<RegisterResponse>;
  abstract GetCurrentUser(): Observable<User>;
  abstract RefreshToken(): Observable<AuthTokens>;
  abstract Logout(): Observable<void>;
}
