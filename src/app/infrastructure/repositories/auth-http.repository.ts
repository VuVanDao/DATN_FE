import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { firstValueFrom, map, Observable } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  AuthTokens,
} from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../storage/storage.service';
import { ApiResponse, AuthResponseDto } from '../dtos/auth.dto';
import { AuthMapper } from '../mappers/auth.mapper';

@Injectable({
  providedIn: 'root',
})
export class AuthHttpRepository implements AuthRepository {
  private readonly API_URL = 'http://localhost:5000/api/auth';
  private readonly http = inject(HttpClient);
  private readonly storageService: StorageService;
  //   constructor(
  //     private http: HttpClient,
  //     private storageService: StorageService,
  //   ) {}
  // same với cái constructor trên nhưng viết theo cách khác
  constructor(http: HttpClient, storageService: StorageService) {
    this.http = http;
    this.storageService = storageService;
  }
  Login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<AuthResponseDto>>(`${this.API_URL}/login`, {
        Email: request.Email,
        Password: request.Password,
      })
      .pipe(
        map((res) => {
          const result = AuthMapper.toLoginResponse(res.data);
          this.storageService.saveAuthData(result.Tokens, result.User);
          return result;
        }),
      );
  }
  Register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<ApiResponse<AuthResponseDto>>(`${this.API_URL}/register`, {
        Email: request.Email,
        Password: request.Password,
        Username: request.Username,
      })
      .pipe(
        map((res) => {
          const result = AuthMapper.toLoginResponse(res.data);
          this.storageService.saveAuthData(result.Tokens, result.User);
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
  RefreshToken(): Observable<AuthTokens> {
    const refreshToken = this.storageService.getRefreshToken();
    return this.http
      .post<ApiResponse<AuthResponseDto>>(`${this.API_URL}/refresh-token`, {
        refreshToken,
      })
      .pipe(
        map((res) => {
          const result = AuthMapper.toLoginResponse(res.data);
          this.storageService.saveAuthData(result.Tokens, result.User);
          return result.Tokens;
        }),
      );
  }
  Logout(): Observable<void> {
    const refreshToken = this.storageService.getRefreshToken();
    return this.http.post(`${this.API_URL}/revoke-token`, { refreshToken }).pipe(
      map((res) => {
        this.storageService.clear();
      }),
    );
  }
}
