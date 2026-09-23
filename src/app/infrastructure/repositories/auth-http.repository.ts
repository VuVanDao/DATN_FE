import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { firstValueFrom, map, Observable } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  AuthTokens,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../storage/storage.service';
import { ApiResponse, AuthResponseDto } from '../dtos/auth.dto';
import { AuthMapper } from '../mappers/auth.mapper';
import { environment } from '../../../environments/environment';

import { TokenService } from '../storage/token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthHttpRepository implements AuthRepository {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly http: HttpClient;
  private readonly storageService: StorageService;
  private readonly tokenService: TokenService;

  constructor(http: HttpClient, storageService: StorageService, tokenService: TokenService) {
    this.http = http;
    this.storageService = storageService;
    this.tokenService = tokenService;
  }

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
      .pipe(
        map((res) => {
          const result = AuthMapper.toLoginResponse(res.data);
          this.tokenService.setAccessToken(result.tokens.accessToken);
          this.storageService.saveUserData(result.user);
          return result;
        }),
      );
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
      .pipe(
        map((res) => {
          const result = AuthMapper.toLoginResponse(res.data);
          this.tokenService.setAccessToken(result.tokens.accessToken);
          this.storageService.saveUserData(result.user);
          return result;
        }),
      );
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
      .pipe(
        map((res) => {
          const result = AuthMapper.toLoginResponse(res.data);
          this.tokenService.setAccessToken(result.tokens.accessToken);
          this.storageService.saveUserData(result.user);
          return result;
        }),
      );
  }
  Logout(): Observable<void> {
    return this.http
      .post(`${this.API_URL}/revoke-token`, {}, { withCredentials: true })
      .pipe(
        map(() => {
          this.tokenService.clear();
          this.storageService.clear();
        }),
      );
  }
  ForgotPassword(request: ForgotPasswordRequest): Observable<string> {
    const email = request.email;
    return this.http.post<ApiResponse<string>>(`${this.API_URL}/forgot-password`, { email }).pipe(
      map((res) => {
        return res.data;
      }),
    );
  }
  ResetPassword(request: ResetPasswordRequest): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(`${this.API_URL}/reset-password`, request).pipe(
      map((res) => {
        return res.data;
      }),
    );
  }
}
