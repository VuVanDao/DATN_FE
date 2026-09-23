import { Component, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { ProfileStore } from '../../../../state/profile.store';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [MatTooltipModule, MatIconModule],
  templateUrl: './profile-overview.component.html',
})
export class ProfileOverviewComponent {
  readonly profileStore = inject(ProfileStore);

  /** Badge màu thống nhất cho role */
  readonly roleBadgeClass =
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
  onAvatarSelected = (event: Event): void => {
    // Ép phần tử phát sinh sự kiện thành input file
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP');
      input.value = '';
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast.error('Ảnh đại diện không được vượt quá 5 MB');
      input.value = '';
      return;
    }
    this.profileStore.uploadAvatar(file);
    input.value = '';
  };
}
