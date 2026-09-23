import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LoginUseCase } from '../../application/auth/login.use-case';
import { RegisterUseCase } from '../../application/auth/register.use-case';
import { LogoutUseCase } from '../../application/auth/logout.use-case';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { TokenService } from '../../infrastructure/storage/token.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { Router } from '@angular/router';
import { ChangePasswordRequest, UpdateProfileRequest, User } from '../../domain/models/user.model';
import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '../../domain/models/auth.model';
import { GetCurrentUserUseCase } from '../../application/user/get-current-user.use-case';
import { UpdateProfileUseCase } from '../../application/user/update-profile.use-case';
import { ChangePasswordUseCase } from '../../application/user/change-password.use-case';
import { toast } from 'ngx-sonner';
import { ForgotPasswordUseCase } from '../../application/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/auth/reset-password.use-case';
import { UploadAvatarUseCase } from '../../application/user/upload-avatar.use-case';
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
  private readonly _getCurrentUserUseCase = inject(GetCurrentUserUseCase);
  private readonly _updateProfileUseCase = inject(UpdateProfileUseCase);
  private readonly _changePasswordUseCase = inject(ChangePasswordUseCase);
  private readonly _forgotPasswordUseCase = inject(ForgotPasswordUseCase);
  private readonly _resetPasswordUseCase = inject(ResetPasswordUseCase);
  private readonly _uploadAvatarUseCase = inject(UploadAvatarUseCase);
  private readonly _storageService = inject(StorageService);
  private readonly _tokenService = inject(TokenService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  // States
  private readonly _currentUser = signal<User | null>(this._storageService.getUserData());
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _isProfileLoading = signal<boolean>(false);
  private readonly _isPasswordChanging = signal<boolean>(false);
  private readonly _isAvatarUploading = signal<boolean>(false);

  // Public readonly states
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly isProfileLoading = this._isProfileLoading.asReadonly();
  readonly isPasswordChanging = this._isPasswordChanging.asReadonly();
  readonly isAvatarUploading = this._isAvatarUploading.asReadonly();

  readonly isAuthenticated = computed(() => !!this._currentUser());

  // Silent Refresh khi khởi động ứng dụng (App Initializer)
  initSession(): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) {
      return Promise.resolve();
    }

    // Nếu trong sessionStorage đã có sẵn Access Token (khi F5 tab hiện tại)
    // và đã có thông tin User -> Dùng lại ngay, HOÀN TOÀN KHÔNG GỌI API /refresh-token
    if (this._tokenService.hasToken() && this._currentUser()) {
      return Promise.resolve();
    }

    // Nếu chưa có Access Token (khi mở Tab mới tinh hoặc mới truy cập)
    // -> Dùng HttpOnly Cookie gọi /refresh-token để lấy Access Token cho tab này
    return new Promise<void>((resolve) => {
      this._authRepository.RefreshToken().subscribe({
        next: (response) => {
          this._currentUser.set(response.User);
          this._storageService.saveUserData(response.User);
          this._tokenService.setAccessToken(response.Tokens.AccessToken);
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

    this._loginUseCase.execute(request).subscribe({
      next: (response) => {
        this._tokenService.setAccessToken(response.Tokens.AccessToken);
        this._currentUser.set(response.User);
        this._isLoading.set(false);
        this.router.navigate(['/']);
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
        this._tokenService.setAccessToken(response.Tokens.AccessToken);
        this._currentUser.set(response.User);
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
        this._tokenService.clear();
        this._currentUser.set(null);
        this._isLoading.set(false);
        this._storageService.clear();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Kể cả BE lỗi mạng thì FE vẫn xóa sạch phiên để user thoát ra an toàn
        this._tokenService.clear();
        this._currentUser.set(null);
        this._isLoading.set(false);
        this._storageService.clear();
        this.router.navigate(['/login']);
      },
    });
  }

  clearSession(): void {
    this._tokenService.clear();
    this._currentUser.set(null);
    this._isLoading.set(false);
    this._isProfileLoading.set(false);
    this._isPasswordChanging.set(false);
    this._errorMessage.set(null);
    this._storageService.clear();
    this.router.navigate(['/login']);
  }

  getCurrentUser(onSuccess?: () => void, onError?: () => void): void {
    this._isProfileLoading.set(true);
    this._getCurrentUserUseCase.execute().subscribe({
      next: (userData: User) => {
        this._isProfileLoading.set(false);
        this._currentUser.set(userData);
        this._storageService.saveUserData(userData);
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        this._isProfileLoading.set(false);
        if (onError) {
          onError();
        }
      },
    });
  }

  updateProfile(request: UpdateProfileRequest, onSuccess?: () => void, onError?: () => void): void {
    this._updateProfileUseCase.execute(request).subscribe({
      next: (userData: User) => {
        this._currentUser.set(userData);
        this._storageService.saveUserData(userData);
        toast.success('Cập nhật thông tin hồ sơ thành công');
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

  changePassword(
    request: ChangePasswordRequest,
    onSuccess?: () => void,
    onError?: () => void,
  ): void {
    this._isPasswordChanging.set(true);
    this._changePasswordUseCase.execute(request).subscribe({
      next: () => {
        this._isPasswordChanging.set(false);
        toast.success('Đổi mật khẩu thành công!');
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        this._isPasswordChanging.set(false);
        toast.error(extractApiErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại'));
        if (onError) {
          onError();
        }
      },
    });
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
  resetPassword = (
    request: ResetPasswordRequest,
    onSuccess?: () => void,
    onError?: () => void,
  ): void => {
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
  };
  uploadAvatar = (file: File): void => {
    this._isAvatarUploading.set(true);
    this._uploadAvatarUseCase.execute(file).subscribe({
      next: (avatarUrl) => {
        const currUser = this._currentUser();
        if (currUser) {
          const updatedUser: User = {
            ...currUser,
            AvatarUrl: avatarUrl,
          };
          this._currentUser.set(updatedUser);
          this._storageService.saveUserData(updatedUser);
        }
        this._isAvatarUploading.set(false);
        toast.success('Cập nhật ảnh đại diện thành công');
      },
      error: (err) => {
        this._isAvatarUploading.set(false);
        toast.error(extractApiErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại'));
      },
    });
  };
  clearError(): void {
    this._errorMessage.set(null);
  }
}
