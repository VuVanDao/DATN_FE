import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../state/auth.store';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiAssistantService, AiMessage } from '../../../application/ai/ai-assistant.service';
import { MatIconModule } from '@angular/material/icon';
export interface NotificationItem {
  id: number;
  icon: string;
  color: string;
  text: string;
  time: string;
  unread: boolean;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  initial: string;
  color: string;
  membersCount?: number;
}

export interface RecentBoardItem {
  id: string;
  name: string;
  color: string;
  isPinned: boolean;
}

export interface RecentWorkspaceItem {
  id: string;
  name: string;
  initial: string;
  color: string;
  isPinned: boolean;
}

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    MatCardModule,
    MatTooltipModule,
    MatIconModule,
  ],
  selector: 'app-main-layout',
  standalone: true,
  templateUrl: './main-layout.html',
})
export class MainLayout implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly aiService = inject(AiAssistantService);

  readonly isDropdownOpen = signal<boolean>(false);
  readonly isNotifOpen = signal<boolean>(false);
  readonly isSidebarCollapsed = signal<boolean>(false);
  readonly isDarkMode = signal<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('theme') !== 'light' : true
  );
  readonly searchQuery = signal<string>('');

  // Phân quyền Quản trị: chỉ tài khoản SystemAdmin hoặc Admin mới thấy tab Quản trị
  readonly isSystemAdmin = computed(() => {
    const roles = this.authStore.currentUser()?.Roles || [];
    return roles.includes('SystemAdmin') || roles.includes('Admin');
  });

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

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((collapsed) => !collapsed);
  }

  markAllAsRead(): void {
    this.notifData.update((list) => list.map((item) => ({ ...item, unread: false })));
  }

  // ===== RECENT SECTION STATE (Bảng & Workspace gần đây/đã ghim) =====
  readonly isRecentOpen = signal<boolean>(false);
  readonly isRecentBoardsOpen = signal<boolean>(true);
  readonly isRecentWorkspacesOpen = signal<boolean>(true);

  readonly recentBoards = signal<RecentBoardItem[]>([
    { id: 'rb-1', name: 'App di động Fintech', color: 'bg-indigo-500', isPinned: false },
    { id: 'rb-2', name: 'Website bán hàng', color: 'bg-emerald-500', isPinned: false },
    { id: 'rb-3', name: 'Core API Service', color: 'bg-blue-500', isPinned: true },
    { id: 'rb-4', name: 'Hệ thống Quản lý Task', color: 'bg-amber-500', isPinned: true },
  ]);

  readonly recentBoardsList = computed(() =>
    this.recentBoards().filter((b) => !b.isPinned)
  );
  readonly pinnedBoardsList = computed(() =>
    this.recentBoards().filter((b) => b.isPinned)
  );

  readonly recentWorkspacesList = computed<RecentWorkspaceItem[]>(() => [
    {
      id: 'rws-1',
      name: 'Marketing Team',
      initial: 'M',
      color: 'bg-linear-to-br from-purple-500 to-indigo-600',
      isPinned: false,
    },
    {
      id: 'rws-2',
      name: 'Kỹ thuật & Sản phẩm',
      initial: 'K',
      color: 'bg-linear-to-br from-blue-500 to-cyan-600',
      isPinned: false,
    },
  ]);

  readonly pinnedWorkspacesList = computed<RecentWorkspaceItem[]>(() => [
    {
      id: 'rws-3',
      name: 'Fintech Mobile App',
      initial: 'F',
      color: 'bg-linear-to-br from-amber-500 to-orange-600',
      isPinned: true,
    },
  ]);

  toggleRecent(): void {
    this.isRecentOpen.update((v) => !v);
  }

  toggleRecentBoards(): void {
    this.isRecentBoardsOpen.update((v) => !v);
  }

  toggleRecentWorkspaces(): void {
    this.isRecentWorkspacesOpen.update((v) => !v);
  }

  // ===== WORKSPACE STATE =====
  readonly workspaces = signal<WorkspaceItem[]>([
    {
      id: 'ws-1',
      name: 'Marketing Team',
      initial: 'M',
      color: 'bg-linear-to-br from-purple-500 to-indigo-600',
      membersCount: 12,
    },
    {
      id: 'ws-2',
      name: 'Kỹ thuật & Sản phẩm',
      initial: 'K',
      color: 'bg-linear-to-br from-blue-500 to-cyan-600',
      membersCount: 8,
    },
    {
      id: 'ws-3',
      name: 'Chăm sóc khách hàng',
      initial: 'C',
      color: 'bg-linear-to-br from-emerald-500 to-teal-600',
      membersCount: 6,
    },
    {
      id: 'ws-4',
      name: 'Fintech Mobile App',
      initial: 'F',
      color: 'bg-linear-to-br from-amber-500 to-orange-600',
      membersCount: 15,
    },
    {
      id: 'ws-5',
      name: 'Đội ngũ Nhân sự',
      initial: 'N',
      color: 'bg-linear-to-br from-rose-500 to-pink-600',
      membersCount: 5,
    },
  ]);

  readonly totalWorkspacesCount = computed(() => this.workspaces().length);
  readonly displayedWorkspaces = computed(() => this.workspaces().slice(0, 3));

  // ===== AI ASSISTANT STATE =====
  readonly isAiDrawerOpen = signal<boolean>(false);
  readonly aiMessages = signal<AiMessage[]>(this.aiService.getInitialMessages());
  readonly suggestedPrompts = signal<string[]>(this.aiService.getSuggestedPrompts());
  readonly currentAiInput = signal<string>('');
  readonly isAiThinking = signal<boolean>(false);

  toggleAiDrawer(): void {
    this.isAiDrawerOpen.update((v) => !v);
  }

  closeAiDrawer(): void {
    this.isAiDrawerOpen.set(false);
  }

  sendAiMessage(promptText?: string): void {
    const text = (promptText || this.currentAiInput()).trim();
    if (!text || this.isAiThinking()) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userMsg: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: timeStr,
    };

    this.aiMessages.update((msgs) => [...msgs, userMsg]);
    this.currentAiInput.set('');
    this.isAiThinking.set(true);

    this.aiService.sendMessage(text).subscribe({
      next: (aiReply) => {
        this.aiMessages.update((msgs) => [...msgs, aiReply]);
        this.isAiThinking.set(false);
      },
      error: () => {
        this.isAiThinking.set(false);
      },
    });
  }

  navigateToSettings(): void {
    this.closeDropdown();
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
