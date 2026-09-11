import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../state/auth.store';
import { LayoutService } from '../../../../../application/layout/layout.service';

export interface NotificationItem {
  id: number;
  icon: string;
  color: string;
  text: string;
  time: string;
  unread: boolean;
}

@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [RouterLink, FormsModule, MatCardModule, MatTooltipModule, MatIconModule],
  templateUrl: './main-header.component.html',
})
export class MainHeaderComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

  readonly isDropdownOpen = signal<boolean>(false);
  readonly isNotifOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  readonly isDarkMode = signal<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('theme') !== 'light' : true,
  );

  // Phân quyền Quản trị: chỉ tài khoản SystemAdmin hoặc Admin mới thấy tab Quản trị
  readonly isSystemAdmin = computed(() => {
    const roles = this.authStore.currentUser()?.Roles || [];
    return roles.includes('SystemAdmin') || roles.includes('Admin');
  });

  readonly notifData = signal<NotificationItem[]>([
    {
      id: 1,
      icon: 'user-plus',
      color: 'bg-purple-500/15 text-purple-400',
      text: '<b>Trang Vũ</b> đã mời bạn tham gia không gian <b>Marketing Team</b>',
      time: '5 phút trước',
      unread: true,
    },
    {
      id: 2,
      icon: 'clipboard-check',
      color: 'bg-blue-500/15 text-blue-400',
      text: '<b>Lan Phạm</b> đã giao cho bạn task <b>TASK-142</b>',
      time: '32 phút trước',
      unread: true,
    },
    {
      id: 3,
      icon: 'at-sign',
      color: 'bg-indigo-500/15 text-indigo-400',
      text: '<b>Nam Trần</b> đã nhắc đến bạn trong bình luận của <b>BUG-201</b>',
      time: '1 giờ trước',
      unread: true,
    },
    {
      id: 4,
      icon: 'alarm-clock',
      color: 'bg-red-500/15 text-red-400',
      text: 'Task <b>BUG-201</b> sắp đến hạn vào ngày mai',
      time: '3 giờ trước',
      unread: true,
    },
  ]);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const isDark = savedTheme !== 'light';
      this.isDarkMode.set(isDark);
      this.applyTheme(isDark);
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

  toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
    if (this.isDropdownOpen()) {
      this.isNotifOpen.set(false);
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  toggleNotif(): void {
    this.isNotifOpen.update((open) => !open);
    if (this.isNotifOpen()) {
      this.isDropdownOpen.set(false);
    }
  }

  closeNotif(): void {
    this.isNotifOpen.set(false);
  }

  markAllAsRead(): void {
    this.notifData.update((list) => list.map((item) => ({ ...item, unread: false })));
  }

  navigateToProfile(): void {
    this.closeDropdown();
    this.layoutService.setSidebar('settings');
    this.router.navigate(['/profile']);
  }

  navigateToSettings(): void {
    this.closeDropdown();
    this.layoutService.setSidebar('settings');
    this.router.navigate(['/settings']);
  }

  navigateToAdmin(): void {
    this.closeDropdown();
    this.router.navigate(['/security']);
  }

  onLogOut(): void {
    this.authStore.logout();
  }
}
