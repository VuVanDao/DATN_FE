import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { LayoutService } from '../../../../../application/layout/layout.service';
import { AuthStore } from '../../../../../application/state/auth.store';
import { UserNotificationStore } from '../../../../../application/state/user-notification.store';
import { UserNotification } from '../../../../../domain/models/user-notification.model';

interface NotificationVisualMeta {
  icon: string;
  badgeClass: string;
}

const NOTIFICATION_VISUAL_MAP: Record<string, NotificationVisualMeta> = {
  WorkspaceInvite: {
    icon: 'group_add',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  },
  ProjectInvite: {
    icon: 'folder_shared',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  },
  CardAssigned: {
    icon: 'assignment_ind',
    badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  },
  CommentMention: {
    icon: 'alternate_email',
    badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  },
  DueDateReminder: {
    icon: 'alarm',
    badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400',
  },
  SprintStarted: {
    icon: 'bolt',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
};

const DEFAULT_NOTIFICATION_VISUAL: NotificationVisualMeta = {
  icon: 'notifications',
  badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
};

@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [RouterLink, FormsModule, MatCardModule, MatTooltipModule, MatIconModule, MatMenuModule],
  templateUrl: './main-header.component.html',
})
export class MainHeaderComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly layoutService = inject(LayoutService);
  readonly notificationStore = inject(UserNotificationStore);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isNotifOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  readonly isDarkMode = signal<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('theme') !== 'light' : true,
  );

  // Phân quyền Quản trị: chỉ tài khoản SystemAdmin hoặc Admin mới thấy tab Quản trị
  readonly isSystemAdmin = computed(() => {
    const user = this.authStore.currentUser();
    return user?.role === 'SystemAdmin' || user?.role === 'Admin';
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      const isDark = savedTheme !== 'light';
      this.isDarkMode.set(isDark);
      this.applyTheme(isDark);
      this.notificationStore.initialize();
    }
  }

  toggleTheme(): void {
    this.isDarkMode.update((dark) => !dark);
    this.applyTheme(this.isDarkMode());
  }

  private applyTheme(isDark: boolean): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }

  toggleNotif(): void {
    const willOpen = !this.isNotifOpen();
    this.isNotifOpen.set(willOpen);
    if (willOpen) {
      this.notificationStore.initialize();
    }
  }

  closeNotif(): void {
    this.isNotifOpen.set(false);
  }

  markAllAsRead(): void {
    this.notificationStore.markAllAsRead();
  }

  onNotificationClick(item: UserNotification): void {
    this.notificationStore.markAsRead(item);
    this.closeNotif();
    if (item.targetUrl) {
      void this.router.navigateByUrl(item.targetUrl);
    }
  }

  getNotificationVisual(type: string): NotificationVisualMeta {
    return NOTIFICATION_VISUAL_MAP[type] ?? DEFAULT_NOTIFICATION_VISUAL;
  }

  formatNotificationTime(isoDate: string): string {
    const timestamp = Date.parse(isoDate);
    if (Number.isNaN(timestamp)) {
      return '';
    }

    const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 60) return 'Vừa xong';

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  }

  navigateToProfile(): void {
    this.layoutService.setSidebar('settings');
    this.router.navigate(['/profile']);
  }

  navigateToSettings(): void {
    this.layoutService.setSidebar('settings');
    this.router.navigate(['/change-password']);
  }

  navigateToAdmin(): void {
    this.layoutService.setSidebar('admin');
    this.router.navigate(['/admin/users']);
  }

  onLogOut(): void {
    this.authStore.logout();
  }
}
