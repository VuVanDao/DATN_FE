import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of, Subject, takeUntil, tap } from 'rxjs';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';
import { AuthStorageService } from '../../infrastructure/storage/auth-storage.service';
import { TokenRefreshService } from '../../infrastructure/http/token-refresh.service';
import { ForgotPasswordUseCase } from '../auth/forgot-password.use-case';
import { LoginUseCase } from '../auth/login.use-case';
import { LogoutUseCase } from '../auth/logout.use-case';
import { RegisterUseCase } from '../auth/register.use-case';
import { ResetPasswordUseCase } from '../auth/reset-password.use-case';
import { NotificationService } from '../shared/notification.service';
import { StoreRequestRunner } from './store-request.util';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly registerUseCase = inject(RegisterUseCase);
  private readonly logoutUseCase = inject(LogoutUseCase);
  private readonly forgotUseCase = inject(ForgotPasswordUseCase);
  private readonly resetUseCase = inject(ResetPasswordUseCase);
  private readonly tokenRefreshService = inject(TokenRefreshService);
  private readonly storage = inject(AuthStorageService);
  private readonly users = inject(UserRepository);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);

  private readonly user = signal<User | null>(this.storage.getUser());
  private readonly sessionEnded = new Subject<void>();
  private readonly loading = signal(false);
  private readonly forgetting = signal(false);
  private readonly resetting = signal(false);
  private readonly error = signal<string | null>(null);

  readonly currentUser = this.user.asReadonly();
  readonly currentUserId = computed(() => this.user()?.id);
  readonly isAuthenticated = computed(() => !!this.user());
  readonly ended$ = this.sessionEnded.asObservable();
  readonly isLoading = this.loading.asReadonly();
  readonly isForgettingPassword = this.forgetting.asReadonly();
  readonly isResettingPassword = this.resetting.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  constructor() {
    this.ended$.pipe(takeUntilDestroyed()).subscribe(() => this.error.set(null));
  }

  establish(response: LoginResponse): void {
    this.storage.setAccessToken(response.tokens.accessToken);
    this.updateCurrentUser(response.user);
  }

  updateCurrentUser(user: User): void {
    this.user.set(user);
    this.storage.setUser(user);
  }

  updateUser(user: User): void {
    this.updateCurrentUser(user);
  }

  clear(): void {
    this.storage.clear();
    this.user.set(null);
    this.sessionEnded.next();
  }

  clearSession(): void {
    this.clear();
    void this.router.navigate(['/login']);
  }

  clearError(): void {
    this.error.set(null);
  }

  async initSession(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.storage.hasToken() && this.currentUser()) {
      this.users
        .getCurrentUser()
        .pipe(takeUntil(this.ended$))
        .subscribe({
          next: (user) => this.updateCurrentUser(user),
          error: () => {},
        });
      return;
    }
    await firstValueFrom(
      this.tokenRefreshService.refresh().pipe(
        tap((response) => this.establish(response)),
        catchError(() => {
          this.clear();
          return of(null);
        }),
      ),
      { defaultValue: null },
    );
  }

  login(request: LoginRequest, returnUrl = '/'): void {
    if (this.loading()) return;
    this.clearError();
    this.requests.run({
      loading: this.loading,
      request$: this.loginUseCase.execute(request),
      cancel$: this.ended$,
      fallbackErrorMessage: 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản/mật khẩu',
      toastOnError: false,
      onSuccess: (response) => {
        this.establish(response);
        void this.router.navigateByUrl(
          returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/',
        );
      },
      onError: (message) => this.error.set(message),
    });
  }

  register(request: RegisterRequest): void {
    if (this.loading()) return;
    this.clearError();
    this.requests.run({
      loading: this.loading,
      request$: this.registerUseCase.execute(request),
      cancel$: this.ended$,
      fallbackErrorMessage: 'Đăng ký thất bại. Vui lòng thử lại',
      toastOnError: false,
      onSuccess: (response) => {
        this.establish(response);
        void this.router.navigate(['/']);
      },
      onError: (message) => this.error.set(message),
    });
  }

  logout(): void {
    if (this.loading()) return;
    this.clear();
    this.requests.run({
      loading: this.loading,
      request$: this.logoutUseCase.execute(),
      fallbackErrorMessage: 'Đăng xuất thất bại',
      toastOnError: false,
      onSuccess: () => {
        void this.router.navigate(['/login']);
      },
      onError: () => {
        void this.router.navigate(['/login']);
      },
    });
  }

  forgotPassword(
    request: ForgotPasswordRequest,
    onSuccess?: () => void,
    onError?: () => void,
  ): void {
    if (this.forgetting()) return;
    this.requests.run({
      loading: this.forgetting,
      request$: this.forgotUseCase.execute(request),
      cancel$: this.ended$,
      fallbackErrorMessage: 'Có lỗi xảy ra, vui lòng thử lại',
      onSuccess: (message) => {
        this.notifications.success(message);
        onSuccess?.();
      },
      onError,
    });
  }

  resetPassword(request: ResetPasswordRequest, onSuccess?: () => void, onError?: () => void): void {
    if (this.resetting()) return;
    this.requests.run({
      loading: this.resetting,
      request$: this.resetUseCase.execute(request),
      cancel$: this.ended$,
      fallbackErrorMessage: 'Có lỗi xảy ra, vui lòng thử lại',
      onSuccess,
      onError,
    });
  }
}
