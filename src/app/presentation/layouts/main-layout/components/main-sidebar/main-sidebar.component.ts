import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LayoutService } from '../../../../../application/layout/layout.service';
import { WorkspaceStore } from '../../../../state/workspace.store';
import { AuthStore } from '../../../../state/auth.store';
import { Workspace } from '../../../../../domain/models/workspace.model';
import { WorkspaceCreateModalComponent } from '../../../../components/modals/workspace-create-modal/workspace-create-modal.component';

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
    WorkspaceCreateModalComponent,
  ],
  templateUrl: './main-sidebar.component.html',
})
export class MainSidebarComponent implements OnInit {
  readonly layoutService = inject(LayoutService);
  readonly workspaceStore = inject(WorkspaceStore);
  readonly authStore = inject(AuthStore);

  // trạng thái mở modal tạo mới Workspace
  readonly isCreateModalOpen = signal<boolean>(false);

  ngOnInit(): void {
    if (this.authStore.isAuthenticated()) {
      this.workspaceStore.loadWorkspaces();
    }
  }

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
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

  readonly recentBoardsList = computed(() => this.recentBoards().filter((b) => !b.isPinned));
  readonly pinnedBoardsList = computed(() => this.recentBoards().filter((b) => b.isPinned));

  readonly recentWorkspacesList = computed<RecentWorkspaceItem[]>(() =>
    this.workspaceStore
      .workspaces()
      .slice(0, 2)
      .map((ws) => ({
        id: ws.id,
        name: ws.name,
        initial: ws.initial,
        color: ws.color,
        isPinned: false,
      })),
  );

  readonly pinnedWorkspacesList = computed<RecentWorkspaceItem[]>(() =>
    this.workspaceStore
      .workspaces()
      .slice(2, 3)
      .map((ws) => ({
        id: ws.id,
        name: ws.name,
        initial: ws.initial,
        color: ws.color,
        isPinned: true,
      })),
  );

  toggleRecent(): void {
    this.isRecentOpen.update((v) => !v);
  }

  toggleRecentBoards(): void {
    this.isRecentBoardsOpen.update((v) => !v);
  }

  toggleRecentWorkspaces(): void {
    this.isRecentWorkspacesOpen.update((v) => !v);
  }

  // ===== WORKSPACE STATE (Dùng trực tiếp từ WorkspaceStore) =====
  readonly totalWorkspacesCount = computed(() => this.workspaceStore.totalCount());
  readonly displayedWorkspaces = computed(() => this.workspaceStore.displayedWorkspaces());
}
