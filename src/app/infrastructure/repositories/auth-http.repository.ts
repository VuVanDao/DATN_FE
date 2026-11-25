import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
} from '../../domain/models/auth.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { ApiResponse } from '../dtos/api-response.dto';
import { AuthResponseDto } from '../dtos/auth.dto';
import { AuthMapper } from '../mappers/auth.mapper';

@Injectable({
  providedIn: 'root',
})
export class AuthHttpRepository implements AuthRepository {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<LoginResponse> {
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

  register(request: RegisterRequest): Observable<RegisterResponse> {
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

  refreshToken(): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<AuthResponseDto>>(
        `${this.API_URL}/refresh-token`,
        {},
        { withCredentials: true },
      )
      .pipe(map((res) => AuthMapper.toLoginResponse(res.data)));
  }

  logout(): Observable<void> {
    return this.http
      .post(`${this.API_URL}/revoke-token`, {}, { withCredentials: true })
      .pipe(map(() => void 0));
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<string> {
    const email = request.email;
    return this.http
      .post<ApiResponse<string>>(`${this.API_URL}/forgot-password`, { email })
      .pipe(map((res) => res.data));
  }

  resetPassword(request: ResetPasswordRequest): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(`${this.API_URL}/reset-password`, request)
      .pipe(map((res) => res.data));
  }
}
