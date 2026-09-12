import { inject, Injectable, signal } from '@angular/core';
import { ChangePasswordUseCase } from '../../application/user/change-password.use-case';
import { ChangePasswordRequest, User } from '../../domain/models/user.model';
import { GetCurrentUserUseCase } from '../../application/user/get-current-user.use-case';

@Injectable({
  providedIn: 'root',
})
export class UserStore {
  private readonly _changePasswordUseCase = inject(ChangePasswordUseCase);
  private readonly _getCurrentUser = inject(GetCurrentUserUseCase);
  // Trạng thái Form & Thông báo
  readonly isLoading = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly currentUserData = signal<User | null>(null);

  changePassword = (request: ChangePasswordRequest, onSuccess?: () => void): void => {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this._changePasswordUseCase
      .execute({
        CurrentPassword: request.CurrentPassword,
        NewPassword: request.NewPassword,
        ConfirmNewPassword: request.ConfirmNewPassword,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.errorMessage.set(null);
          this.successMessage.set('Đổi mật khẩu thành công!');
          if (onSuccess) {
            onSuccess();
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorsList = err?.error?.errors;
          let detailedMsg: string | null = null;
          if (Array.isArray(errorsList) && errorsList.length > 0) {
            detailedMsg = errorsList[0];
          } else if (typeof errorsList === 'object' && errorsList !== null) {
            // Trường hợp errors là object { NewPassword: ["..."] }
            const firstKey = Object.keys(errorsList)[0];
            detailedMsg = errorsList[firstKey]?.[0];
          }
          // Nếu không có mảng errors thì mới lấy message chung
          const msg = detailedMsg || err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
          this.errorMessage.set(msg);
        },
      });
  };
  getCurrentUser = (onSucess?: () => void): void => {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this._getCurrentUser.execute().subscribe({
      next: (userData: User) => {
        this.isLoading.set(false);
        this.errorMessage.set(null);
        this.successMessage.set(null);
        this.currentUserData.set(userData);
        if (onSucess) {
          onSucess();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorsList = err?.error?.errors;
        let detailedMsg: string | null = null;
        if (Array.isArray(errorsList) && errorsList.length > 0) {
          detailedMsg = errorsList[0];
        } else if (typeof errorsList === 'object' && errorsList !== null) {
          // Trường hợp errors là object { NewPassword: ["..."] }
          const firstKey = Object.keys(errorsList)[0];
          detailedMsg = errorsList[firstKey]?.[0];
        }
        // Nếu không có mảng errors thì mới lấy message chung
        const msg = detailedMsg || err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại';
        this.errorMessage.set(msg);
      },
    });
  };
  onCancel(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
