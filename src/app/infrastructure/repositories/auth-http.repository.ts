import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { map, Observable } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../storage/storage.service';
import { ApiResponse, AuthResponseDto } from '../dtos/auth.dto';
import { AuthMapper } from '../mappers/auth.mapper';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthHttpRepository implements AuthRepository {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);

  Login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<AuthResponseDto>>(
        `${this.API_URL}/login`,
        {
          Email: request.email,
          Password: request.password,
        },
        { withCredentials: true },
      )
      .pipe(map((res) => AuthMapper.toLoginResponse(res.data)));
  }

  Register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<ApiResponse<AuthResponseDto>>(
        `${this.API_URL}/register`,
        {
          Email: request.email,
          Password: request.password,
          Username: request.username,
        },
        { withCredentials: true },
      )
      .pipe(map((res) => AuthMapper.toLoginResponse(res.data)));
  }

  GetCurrentUser(): Observable<User> {
    return new Observable((observer) => {
      const user = this.storageService.getUserData();
      if (user) {
        observer.next(user);
        observer.complete();
      } else {
        observer.error(new Error('Không tìm thấy thông tin User'));
      }
    });
  }

  RefreshToken(): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<AuthResponseDto>>(
        `${this.API_URL}/refresh-token`,
        {},
        { withCredentials: true },
      )
      .pipe(map((res) => AuthMapper.toLoginResponse(res.data)));
  }

  Logout(): Observable<void> {
    return this.http
      .post(`${this.API_URL}/revoke-token`, {}, { withCredentials: true })
      .pipe(map(() => void 0));
  }

  ForgotPassword(request: ForgotPasswordRequest): Observable<string> {
    const email = request.email;
    return this.http
      .post<ApiResponse<string>>(`${this.API_URL}/forgot-password`, { email })
      .pipe(map((res) => res.data));
  }

  ResetPassword(request: ResetPasswordRequest): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(`${this.API_URL}/reset-password`, request)
      .pipe(map((res) => res.data));
  }
}
