import { inject, Injectable, signal } from '@angular/core';
import { toast } from 'ngx-sonner';
import { ChangePasswordRequest, UpdateProfileRequest, User } from '../../domain/models/user.model';
import { GetCurrentUserUseCase } from '../../application/user/get-current-user.use-case';
import { UpdateProfileUseCase } from '../../application/user/update-profile.use-case';
import { ChangePasswordUseCase } from '../../application/user/change-password.use-case';
import { UploadAvatarUseCase } from '../../application/user/upload-avatar.use-case';
import { extractApiErrorMessage } from '../../shared/utils/api-error.util';
import { AuthStore } from './auth.store';

/**
 * Store quản lý hồ sơ cá nhân: tải thông tin user, cập nhật profile,
 * đổi mật khẩu và upload avatar.
 *
 * Dữ liệu `currentUser` vẫn nằm trong AuthStore (Single Source of Truth);
 * store này chỉ đọc qua `currentUser` và ghi qua `authStore.updateCurrentUser()`.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileStore {
  // Use cases
  private readonly _getCurrentUserUseCase = inject(GetCurrentUserUseCase);
  private readonly _updateProfileUseCase = inject(UpdateProfileUseCase);
  private readonly _changePasswordUseCase = inject(ChangePasswordUseCase);
  private readonly _uploadAvatarUseCase = inject(UploadAvatarUseCase);
  private readonly _authStore = inject(AuthStore);

  // States
  private readonly _isProfileLoading = signal<boolean>(false);
  private readonly _isPasswordChanging = signal<boolean>(false);
  private readonly _isAvatarUploading = signal<boolean>(false);

  // Public readonly states
  /** Trỏ thẳng tới signal user trong AuthStore để tránh nhân bản state */
  readonly currentUser = this._authStore.currentUser;
  readonly isProfileLoading = this._isProfileLoading.asReadonly();
  readonly isPasswordChanging = this._isPasswordChanging.asReadonly();
  readonly isAvatarUploading = this._isAvatarUploading.asReadonly();

  // Actions
  getCurrentUser(onSuccess?: () => void, onError?: () => void): void {
    this._isProfileLoading.set(true);
    this._getCurrentUserUseCase.execute().subscribe({
      next: (userData: User) => {
        this._isProfileLoading.set(false);
        this._authStore.updateCurrentUser(userData);
        if (onSuccess) {
          onSuccess();
        }
      },
      error: () => {
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
        this._authStore.updateCurrentUser(userData);
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

  uploadAvatar(file: File): void {
    this._isAvatarUploading.set(true);
    this._uploadAvatarUseCase.execute(file).subscribe({
      next: (avatarUrl) => {
        const currUser = this._authStore.currentUser();
        if (currUser) {
          this._authStore.updateCurrentUser({
            ...currUser,
            avatarUrl: avatarUrl,
          });
        }
        this._isAvatarUploading.set(false);
        toast.success('Cập nhật ảnh đại diện thành công');
      },
      error: (err) => {
        this._isAvatarUploading.set(false);
        toast.error(extractApiErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại'));
      },
    });
  }
}
