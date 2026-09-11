import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LayoutService } from '../../../../../application/layout/layout.service';

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
  selector: 'app-main-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './main-sidebar.component.html',
})
export class MainSidebarComponent {
  readonly layoutService = inject(LayoutService);

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
}
