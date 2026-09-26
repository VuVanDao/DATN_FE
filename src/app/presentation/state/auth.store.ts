import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LoginUseCase } from '../../application/auth/login.use-case';
import { RegisterUseCase } from '../../application/auth/register.use-case';
import { LogoutUseCase } from '../../application/auth/logout.use-case';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { TokenService } from '../../infrastructure/storage/token.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../domain/models/user.model';
import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '../../domain/models/auth.model';
import { ForgotPasswordUseCase } from '../../application/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/auth/reset-password.use-case';
import { toast } from 'ngx-sonner';
import { extractApiErrorMessage } from '../../shared/utils/api-error.util';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  // Use cases & services
  private readonly _loginUseCase = inject(LoginUseCase);
  private readonly _registerUseCase = inject(RegisterUseCase);
  private readonly _logoutUseCase = inject(LogoutUseCase);
  private readonly _authRepository = inject(AuthRepository);
  private readonly _forgotPasswordUseCase = inject(ForgotPasswordUseCase);
  private readonly _resetPasswordUseCase = inject(ResetPasswordUseCase);
  private readonly _storageService = inject(StorageService);
  private readonly _tokenService = inject(TokenService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly _userRepository = inject(UserRepository);

  // States
  private readonly _currentUser = signal<User | null>(this._storageService.getUserData());
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errorMessage = signal<string | null>(null);

  // Public readonly states
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  readonly isAuthenticated = computed(() => !!this._currentUser());

  // Silent Refresh khi khởi động ứng dụng (App Initializer)
  initSession(): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) {
      return Promise.resolve();
    }
    if (this._tokenService.hasToken() && this._currentUser()) {
      // Gọi ngầm /users/me để làm mới thông tin user (không block render).
      // Nếu BE đã đổi role/profile, FE sẽ cập nhật ngay sau khi API trả về.
      this._userRepository.GetCurrentUser().subscribe({
        next: (freshUser) => this.updateCurrentUser(freshUser),
        error: () => {},
      });
      return Promise.resolve();
    }

    // Nếu chưa có Access Token (khi mở Tab mới tinh hoặc mới truy cập)
    // -> Dùng HttpOnly Cookie gọi /refresh-token để lấy Access Token cho tab này
    return new Promise<void>((resolve) => {
      this._authRepository.RefreshToken().subscribe({
        next: (response) => {
          this.updateCurrentUser(response.user);
          this._tokenService.setAccessToken(response.tokens.accessToken);
          resolve();
        },
        error: () => {
          // Chưa đăng nhập hoặc Refresh Token đã hết hạn / bị thu hồi
          // Âm thầm xóa state, không toast thông báo khi mới mở web
          this._tokenService.clear();
          this._storageService.clear();
          this._currentUser.set(null);
          resolve();
        },
      });
    });
  }

  // Actions
  login(request: LoginRequest): void {
    this._isLoading.set(true);
    this._errorMessage.set(null);
    let urlToNavigateAfterLogin = '/';
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      urlToNavigateAfterLogin = returnUrl;
    }
    this._loginUseCase.execute(request).subscribe({
      next: (response) => {
        this._tokenService.setAccessToken(response.tokens.accessToken);
        this.updateCurrentUser(response.user);
        this._isLoading.set(false);
        this.router.navigate([urlToNavigateAfterLogin]);
      },
      error: (err) => {
        this._isLoading.set(false);
        const mess =
          err?.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản/mật khẩu';
        this._errorMessage.set(mess);
      },
    });
  }

  register(request: RegisterRequest): void {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    this._registerUseCase.execute(request).subscribe({
      next: (response) => {
        this._tokenService.setAccessToken(response.tokens.accessToken);
        this.updateCurrentUser(response.user);
        this._isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this._isLoading.set(false);
        const mess = err?.error?.message || 'Đăng ký thất bại. Vui lòng thử lại';
        this._errorMessage.set(mess);
      },
    });
  }

  logout(): void {
    this._isLoading.set(true);
    this._errorMessage.set(null);
    this._logoutUseCase.execute().subscribe({
      next: () => {
        this._clearSessionAndNavigate();
      },
      error: () => {
        // Kể cả BE lỗi mạng thì FE vẫn xóa sạch phiên để user thoát ra an toàn
        this._clearSessionAndNavigate();
      },
    });
  }

  /** Xóa phiên khi interceptor phát hiện refresh token hết hạn */
  clearSession(): void {
    this._clearSessionAndNavigate();
  }

  /**
   * Cập nhật thông tin user hiện tại trong store + persist xuống storage.
   * Dùng nội bộ và cho ProfileStore ghi dữ liệu user mới.
   */
  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
    this._storageService.saveUserData(user);
  }

  forgotPassword(
    request: ForgotPasswordRequest,
    onSuccess?: () => void,
    onError?: () => void,
  ): void {
    this._forgotPasswordUseCase.execute(request).subscribe({
      next: (res) => {
        toast.success(res);
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        toast.error(extractApiErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại'));
        if (onError) {
          onError();
        }
      },
    });
  }

  resetPassword(request: ResetPasswordRequest, onSuccess?: () => void, onError?: () => void): void {
    this._resetPasswordUseCase.execute(request).subscribe({
      next: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        toast.error(extractApiErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại'));
        if (onError) {
          onError();
        }
      },
    });
  }

  clearError(): void {
    this._errorMessage.set(null);
  }

  private _clearSessionAndNavigate(): void {
    this._tokenService.clear();
    this._storageService.clear();
    this._currentUser.set(null);
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this.router.navigate(['/login']);
  }
}
