import { computed, inject, Injectable, signal } from '@angular/core';
import { LoginUseCase } from '../../application/auth/login.use-case';
import { RegisterUseCase } from '../../application/auth/register.use-case';
import { LogoutUseCase } from '../../application/auth/logout.use-case';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { Router } from '@angular/router';
import { ChangePasswordRequest, UpdateProfileRequest, User } from '../../domain/models/user.model';
import { LoginRequest, RegisterRequest } from '../../domain/models/auth.model';
import { GetCurrentUserUseCase } from '../../application/user/get-current-user.use-case';
import { UpdateProfileUseCase } from '../../application/user/update-profile.use-case';
import { ChangePasswordUseCase } from '../../application/user/change-password.use-case';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  // Use cases
  private readonly _loginUseCase = inject(LoginUseCase);
  private readonly _registerUseCase = inject(RegisterUseCase);
  private readonly _logoutUseCase = inject(LogoutUseCase);
  private readonly _getCurrentUserUseCase = inject(GetCurrentUserUseCase);
  private readonly _updateProfileUseCase = inject(UpdateProfileUseCase);
  private readonly _changePasswordUseCase = inject(ChangePasswordUseCase);
  private readonly _storageService = inject(StorageService);
  private readonly router = inject(Router);

  // States
  private readonly _currentUser = signal<User | null>(this._storageService.getUserData());
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _isProfileLoading = signal<boolean>(false);
  private readonly _isPasswordChanging = signal<boolean>(false);

  // Public readonly states
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly isProfileLoading = this._isProfileLoading.asReadonly();
  readonly isPasswordChanging = this._isPasswordChanging.asReadonly();

  readonly isAuthenticated = computed(() => !!this._currentUser());

  // Actions
  login(request: LoginRequest): void {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    this._loginUseCase.execute(request).subscribe({
      next: (response) => {
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
        this._currentUser.set(null);
        this._isLoading.set(false);
        this._storageService.clear();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Kể cả BE lỗi mạng thì FE vẫn xóa sạch phiên để user thoát ra an toàn
        this._currentUser.set(null);
        this._isLoading.set(false);
        this._storageService.clear();
        this.router.navigate(['/login']);
      },
    });
  }

  clearSession(): void {
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
        const errorsList = err?.error?.errors;
        let detailedMsg: string | null = null;
        if (Array.isArray(errorsList) && errorsList.length > 0) {
          detailedMsg = errorsList[0];
        } else if (typeof errorsList === 'object' && errorsList !== null) {
          const firstKey = Object.keys(errorsList)[0];
          detailedMsg = errorsList[firstKey]?.[0];
        }
        const msg = detailedMsg || err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại';
        toast.error(msg);
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
        const errorsList = err?.error?.errors;
        let detailedMsg: string | null = null;
        if (Array.isArray(errorsList) && errorsList.length > 0) {
          detailedMsg = errorsList[0];
        } else if (typeof errorsList === 'object' && errorsList !== null) {
          const firstKey = Object.keys(errorsList)[0];
          detailedMsg = errorsList[firstKey]?.[0];
        }
        const msg = detailedMsg || err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại';
        toast.error(msg);
        if (onError) {
          onError();
        }
      },
    });
  }

  clearError(): void {
    this._errorMessage.set(null);
  }
}
