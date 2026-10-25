import { DEMO_NOTIFICATIONS } from '../../../../../infrastructure/mocks/layout.fixtures';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '../../../../../application/state/auth.store';
import { LayoutService } from '../../../../../application/layout/layout.service';

@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [RouterLink, FormsModule, MatCardModule, MatTooltipModule, MatIconModule, MatMenuModule],
  templateUrl: './main-header.component.html',
})
export class MainHeaderComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

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

  readonly notifData = signal(DEMO_NOTIFICATIONS);
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

  toggleNotif(): void {
    this.isNotifOpen.update((open) => !open);
  }

  closeNotif(): void {
    this.isNotifOpen.set(false);
  }

  markAllAsRead(): void {
    this.notifData.update((list) => list.map((item) => ({ ...item, unread: false })));
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
