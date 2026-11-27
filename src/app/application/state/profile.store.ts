import { inject, Injectable, signal } from '@angular/core';
import { ChangePasswordRequest, UpdateProfileRequest } from '../../domain/models/user.model';
import { AuthStore } from './auth.store';
import { NotificationService } from '../shared/notification.service';
import { ChangePasswordUseCase } from '../user/change-password.use-case';
import { GetCurrentUserUseCase } from '../user/get-current-user.use-case';
import { UpdateProfileUseCase } from '../user/update-profile.use-case';
import { UploadAvatarUseCase } from '../user/upload-avatar.use-case';
import { StoreRequestRunner } from './store-request.util';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly getUser = inject(GetCurrentUserUseCase);
  private readonly update = inject(UpdateProfileUseCase);
  private readonly change = inject(ChangePasswordUseCase);
  private readonly upload = inject(UploadAvatarUseCase);
  private readonly authStore = inject(AuthStore);
  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);
  private readonly loading = signal(false);
  private readonly saving = signal(false);
  private readonly changing = signal(false);
  private readonly uploading = signal(false);

  readonly currentUser = this.authStore.currentUser;
  readonly isProfileLoading = this.loading.asReadonly();
  readonly isProfileSaving = this.saving.asReadonly();
  readonly isPasswordChanging = this.changing.asReadonly();
  readonly isAvatarUploading = this.uploading.asReadonly();

  getCurrentUser(onSuccess?: () => void, onError?: () => void): void {
    if (this.loading()) return;
    this.requests.run({
      loading: this.loading,
      request$: this.getUser.execute(),
      cancel$: this.authStore.ended$,
      fallbackErrorMessage: 'Không thể tải hồ sơ cá nhân',
      onSuccess: (user) => {
        this.authStore.updateUser(user);
        onSuccess?.();
      },
      onError,
    });
  }

  updateProfile(request: UpdateProfileRequest, onSuccess?: () => void, onError?: () => void): void {
    if (this.saving()) return;
    this.requests.run({
      loading: this.saving,
      request$: this.update.execute(request),
      cancel$: this.authStore.ended$,
      fallbackErrorMessage: 'Cập nhật hồ sơ thất bại',
      onSuccess: (user) => {
        this.authStore.updateUser(user);
        this.notifications.success('Cập nhật thông tin hồ sơ thành công');
        onSuccess?.();
      },
      onError,
    });
  }

  changePassword(
    request: ChangePasswordRequest,
    onSuccess?: () => void,
    onError?: () => void,
  ): void {
    if (this.changing()) return;
    this.requests.run({
      loading: this.changing,
      request$: this.change.execute(request),
      cancel$: this.authStore.ended$,
      fallbackErrorMessage: 'Đổi mật khẩu thất bại',
      onSuccess: () => {
        this.notifications.success('Đổi mật khẩu thành công!');
        onSuccess?.();
      },
      onError,
    });
  }

  uploadAvatar(file: File): void {
    if (this.uploading()) return;
    this.requests.run({
      loading: this.uploading,
      request$: this.upload.execute(file),
      cancel$: this.authStore.ended$,
      fallbackErrorMessage: 'Cập nhật ảnh đại diện thất bại',
      onSuccess: (avatarUrl) => {
        const user = this.currentUser();
        if (user) this.authStore.updateUser({ ...user, avatarUrl });
        this.notifications.success('Cập nhật ảnh đại diện thành công');
      },
    });
  }
}
