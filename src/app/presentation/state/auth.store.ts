import { computed, inject, Injectable, signal } from '@angular/core';
import { LoginUseCase } from '../../application/auth/login.use-case';
import { RegisterUseCase } from '../../application/auth/register.use-case';
import { LogoutUseCase } from '../../application/auth/logout.use-case';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { Router } from '@angular/router';
import { User } from '../../domain/models/user.model';
import { LoginRequest, RegisterRequest } from '../../domain/models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly _loginUseCase = inject(LoginUseCase);
  private readonly _registerUseCase = inject(RegisterUseCase);
  private readonly _logoutUseCase = inject(LogoutUseCase);
  private readonly _storageService = inject(StorageService);
  private readonly router = inject(Router);
  // state
  private readonly _currentUser = signal<User | null>(this._storageService.getUserData());
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errorMessage = signal<string | null>(null);
  // state public ra ngoai, chi dugn de doc, tranh bi sửa bậy
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  readonly isAuthenticated = computed(() => !!this._currentUser());

  // actions: cac hanh dong anh huong toi state
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
  clearError(): void {
    this._errorMessage.set(null);
  }
}
